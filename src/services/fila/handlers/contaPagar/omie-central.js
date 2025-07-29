const { createQueue } = require("../../index");
const IntegracaoContaPagarOmieCentral = require("../../../../models/integracao/contaPagar/omie-central");
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
const Servico = require("../../../../models/Servico");
const DocumentoFiscal = require("../../../../models/DocumentoFiscal");

const handler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    integracao.executadoEm = new Date();
    integracao.tentativas = (integracao.tentativas || 0) + 1;
    await integracao.save();

    const { errors, result } = await retryAsync(async () => {
      if (integracao.tipo === "baixa-realizada") {
        const contaPagar = await ContaPagar.findOneAndUpdate(
          {
            codigo_lancamento_integracao:
              integracao.payload.codigo_lancamento_integracao,
            codigo_lancamento_omie: integracao.payload.codigo_lancamento_omie,
          },
          { ...integracao.payload, status_titulo: "pago" }
        );

        if (!contaPagar) throw new Error("Conta pagar não encontrada.");

        const ticket = await Ticket.findOneAndUpdate(
          { contaPagarOmie: contaPagar._id },
          { status: "concluido", etapa: "concluido" }
        );

        if (ticket?.servicos.length > 0) {
          await Servico.updateMany(
            { _id: { $in: ticket?.servicos } },
            { status: "pago" }
          );
        }

        if (ticket?.documentosFiscais.length > 0) {
          await DocumentoFiscal.updateMany(
            { _id: { $in: ticket?.documentosFiscais } },
            { status: "pago" }
          );
        }

        return { message: "Conta pagar sincronizada com sucesso!" };
      }

      if (integracao.tipo === "baixa-cancelada") {
        const contaPagar = await ContaPagar.findOneAndUpdate(
          {
            codigo_lancamento_integracao:
              integracao.payload.codigo_lancamento_integracao,
            codigo_lancamento_omie: integracao.payload.codigo_lancamento_omie,
          },
          { ...integracao.payload, status_titulo: "A vencer" }
        );

        if (!contaPagar) throw new Error("Conta pagar não encontrada.");

        const ticket = await Ticket.findOneAndUpdate(
          { contaPagarOmie: contaPagar._id },
          { status: "trabalhando", etapa: "conta-pagar-omie-central" }
        );

        if (ticket?.servicos.length > 0) {
          await Servico.updateMany(
            { _id: { $in: ticket?.servicos } },
            { status: "processando" }
          );
        }

        if (ticket?.documentosFiscais.length > 0) {
          await DocumentoFiscal.updateMany(
            { _id: { $in: ticket?.documentosFiscais } },
            { status: "processando" }
          );
        }

        return { message: "Conta pagar sincronizada com sucesso!" };
      }

      if (integracao.tipo === "excluido") {
        const contaPagar = await ContaPagar.findOneAndDelete({
          codigo_lancamento_integracao:
            integracao.payload.codigo_lancamento_integracao,
          codigo_lancamento_omie: integracao.payload.codigo_lancamento_omie,
        });

        if (!contaPagar) throw new Error("Conta pagar não encontrada.");

        const ticket = await Ticket.findOneAndUpdate(
          { contaPagarOmie: contaPagar?._id },
          {
            status: "revisao",
            etapa: "aprovacao-fiscal",
            contaPagarOmie: null,
            observacao: "[CONTA A PAGAR REMOVIDA DO OMIE]",
          }
        );

        if (ticket?.servicos.length > 0) {
          await Servico.updateMany(
            { _id: { $in: ticket?.servicos } },
            { status: "processando" }
          );
        }

        if (ticket?.documentosFiscais.length > 0) {
          await DocumentoFiscal.updateMany(
            { _id: { $in: ticket?.documentosFiscais } },
            { status: "processando" }
          );
        }

        return { message: "Conta pagar sincronizada com sucesso!" };
      }

      if (integracao.tipo === "alterado") {
        console.log("[Payload]", integracao.payload);

        const contaPagar = await ContaPagar.findOneAndUpdate(
          {
            codigo_lancamento_omie: integracao?.payload.codigo_lancamento_omie,
          },
          {
            ...integracao?.payload,
            status_titulo: integracao?.payload?.situacao,
          }
        );

        if (contaPagar) {
          await Ticket.findOneAndUpdate(
            { contaPagarOmie: contaPagar?._id },
            {
              etapa: "conta-pagar-omie-central",
              status: "trabalhando",
            }
          );
        }

        return { message: "Conta pagar sincronizada com sucesso!" };
      }
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
      // ticket.arquivos?.length > 0
      //   ? (integracao.etapa = "upload_arquivos")
      //   : (integracao.etapa = "sucesso");

      integracao.resposta = result;
      integracao.etapa = "sucesso";
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

  let integracao = await IntegracaoContaPagarOmieCentral.findOneAndUpdate(
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
    integracao = await IntegracaoContaPagarOmieCentral.findOneAndUpdate(
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
