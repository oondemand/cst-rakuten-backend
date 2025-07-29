const { createQueue } = require("../../index");
const IntegracaoContaPagarCentralOmie = require("../../../../models/integracao/contaPagar/central-omie");
const IntegracaoArquivosCentralOmieService = require("../../../arquivos/index");
const BaseOmie = require("../../../../models/BaseOmie");
const { retryAsync } = require("../../../../utils");
const Ticket = require("../../../../models/Ticket");
const ContaPagar = require("../../../../models/ContaPagar");
const Sistema = require("../../../../models/Sistema");
const { add } = require("date-fns");

const {
  buscarPrestadorOmie,
} = require("../../../prestador/buscarPrestadorOmie");
const contaPagarService = require("../../../omie/contaPagarService");

const handler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    integracao.executadoEm = new Date();
    integracao.tentativas = (integracao.tentativas || 0) + 1;

    await integracao.save();

    const ticket = await Ticket.findOne({
      contaPagarOmie: integracao.contaPagarId,
    })
      .populate("arquivos")
      .populate("servicos")
      .populate("prestador")
      .populate({
        path: "documentosFiscais",
        populate: {
          path: "arquivo",
        },
      });

    const { errors, result } = await retryAsync(async () => {
      const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
      let prestadorOmie = await buscarPrestadorOmie({
        appKey,
        appSecret,
        prestador: integracao.prestador,
      });

      if (!prestadorOmie) {
        await IntegracaoPrestadorService.create.centralOmie({
          prestador: integracao.prestador,
        });
      }

      let valorTotalDaNota = 0;
      let observacao = `Serviços prestados SID - ${ticket.prestador.sid}\n-- Serviços --\n`;
      let notaFiscalOmie = "";

      for (const { valor, competencia, notaFiscal } of ticket.servicos) {
        const valorTotalFormatado = valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

        observacao += `Competência: ${competencia?.mes}/${competencia?.ano} - Valor total: ${valorTotalFormatado}\n`;
        valorTotalDaNota += valor;
        notaFiscalOmie += `/${notaFiscal}`;
      }

      const config = await Sistema.findOne();
      const dataDaEmissao = new Date();

      const conta = contaPagarService.criarConta({
        numeroDocumento: 1,
        numeroDocumentoFiscal: 1,
        codigoFornecedor: prestadorOmie?.codigo_cliente_omie,
        dataEmissao: dataDaEmissao,
        dataVencimento: add(dataDaEmissao, { hours: 24 }), // 24 horas a mais
        observacao,
        valor: valorTotalDaNota,
        id_conta_corrente: config?.omie?.id_conta_corrente,
        dataRegistro: ticket?.dataRegistro ?? ticket?.servicos[0]?.dataRegistro,
        notaFiscal: notaFiscalOmie?.replace("/", ""),
        codigo_categoria: config?.omie?.codigo_categoria,
      });

      integracao.payload = {
        url: `${process.env.API_OMIE}/financas/contapagar/`,
        body: {
          call: "IncluirContaPagar",
          app_key: appKey,
          app_secret: appSecret,
          param: [
            {
              ...conta,
              codigo_lancamento_integracao:
                integracao.contaPagar.codigo_lancamento_integracao,
            },
          ],
        },
      };

      const contaPagarOmie = await contaPagarService.incluir(
        appKey,
        appSecret,
        {
          ...conta,
          codigo_lancamento_integracao:
            integracao.contaPagar.codigo_lancamento_integracao,
        }
      );

      const contaPagarCentral = await ContaPagar.findByIdAndUpdate(
        integracao.contaPagarId,
        { ...contaPagarOmie },
        { new: true }
      );

      if (ticket.arquivos?.length > 0) {
        for (const arquivo of ticket.arquivos) {
          IntegracaoArquivosCentralOmieService.create.centralOmie({
            contaPagar: contaPagarCentral,
            prestador: ticket.prestador,
            arquivo: arquivo,
            integracaoContaPagarId: integracao?._id,
          });
        }
      }

      if (ticket.documentosFiscais?.length > 0) {
        for (const item of ticket.documentosFiscais) {
          if (item?.arquivo) {
            IntegracaoArquivosCentralOmieService.create.centralOmie({
              contaPagar: contaPagarCentral,
              prestador: ticket.prestador,
              arquivo: item?.arquivo,
              integracaoContaPagarId: integracao?._id,
            });
          }
        }
      }

      return contaPagarOmie;
    });

    if (!result && integracao.tentativas < 3) {
      integracao.etapa = "reprocessar";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];

      await integracao.save();
      return;
    }

    if (!result && integracao.tentativas >= 3) {
      integracao.etapa = "falhas";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];

      await integracao.save();
      return;
    }

    if (result) {
      ticket.arquivos?.length > 0
        ? (integracao.etapa = "upload_arquivos")
        : (integracao.etapa = "sucesso");

      integracao.resposta = result;
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];

      await integracao.save();

      return;
    }
  } catch (err) {
    console.log(err);
    integracao.etapa = "falhas";
    integracao.errors = [
      ...(integracao.errors || []),
      err?.response?.data ?? err?.message,
    ];
    integracao.executadoEm = new Date();
    await integracao.save();
  }
};

const fetchNextIntegracao = async () => {
  const minExecutionTime = new Date(Date.now() - 60 * 1000);

  let integracao = await IntegracaoContaPagarCentralOmie.findOneAndUpdate(
    {
      etapa: "requisicao",
      arquivado: false,
      $or: [
        { executadoEm: { $exists: false } },
        { executadoEm: { $lte: minExecutionTime } },
      ],
    },
    { etapa: "processando", executadoEm: new Date() },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!integracao) {
    integracao = await IntegracaoContaPagarCentralOmie.findOneAndUpdate(
      {
        etapa: "reprocessar",
        arquivado: false,
        $or: [
          { executadoEm: { $exists: false } },
          { executadoEm: { $lte: minExecutionTime } },
        ],
      },
      { etapa: "processando", executadoEm: new Date() },
      { sort: { createdAt: 1 }, new: true }
    );
  }

  return integracao;
};

const queue = createQueue({
  handler: handler,
  next: fetchNextIntegracao,
});

module.exports = queue;
