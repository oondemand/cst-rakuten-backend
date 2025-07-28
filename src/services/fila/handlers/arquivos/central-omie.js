const { createQueue } = require("../../index");
const IntegracaoArquivosCentralOmie = require("../../../../models/integracao/arquivos/central-omie");
const IntegracaoArquivosCentralOmieService = require("../../../arquivos/index");

const Prestador = require("../../../../models/Prestador");
const { retryAsync, sleep } = require("../../../../utils");
const BaseOmie = require("../../../../models/BaseOmie");
const {
  buscarPrestadorOmie,
} = require("../../../prestador/buscarPrestadorOmie");
const clienteService = require("../../../omie/clienteService");
const anexoService = require("../../../omie/anexosService");

const { randomUUID } = require("crypto");
// const Ticket = require("../../../../models/Ticket");
const ContaPagar = require("../../../../models/ContaPagar");
const Sistema = require("../../../../models/Sistema");
const { add } = require("date-fns");
const IntegracaoContaPagarCentralOmie = require("../../../../models/integracao/contaPagar/central-omie");

const handler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    integracao.executadoEm = new Date();
    integracao.tentativas = (integracao.tentativas || 0) + 1;

    await integracao.save();

    const { errors, result } = await retryAsync(async () => {
      const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
      const contaPagar = await ContaPagar.findById(integracao.contaPagarId);

      for (const arquivo of integracao.arquivos) {
        console.log("arquivo", arquivo);

        //  nId: conta.codigo_lancamento_omie,
        //  tabela: "conta-pagar",
        await anexoService.incluir({
          appKey,
          appSecret,
          tabela: "conta-pagar",
          nId: contaPagar.codigo_lancamento_omie,
          nomeArquivo: arquivo?.nomeOriginal,
          tipoArquivo: arquivo?.mimetype,
          arquivo: arquivo?.buffer?.buffer,
        });
      }

      return { message: "Success" };

      // integracao.payload = {
      //   url: `${process.env.API_OMIE}/financas/contapagar/`,
      //   body: {
      //     call: "IncluirContaPagar",
      //     app_key: appKey,
      //     app_secret: appSecret,
      //     param: [
      //       {
      //         ...conta,
      //         codigo_lancamento_integracao:
      //           integracao.contaPagar.codigo_lancamento_integracao,
      //       },
      //     ],
      //   },
      // };
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
      await IntegracaoContaPagarCentralOmie.findByIdAndUpdate(
        integracao.integracaoContaPagarId,
        {
          etapa: "sucesso",
        }
      );

      integracao.etapa = "sucesso";
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

  let integracao = await IntegracaoArquivosCentralOmie.findOneAndUpdate(
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
    integracao = await IntegracaoArquivosCentralOmie.findOneAndUpdate(
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
