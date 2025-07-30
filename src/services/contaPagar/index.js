const IntegracaoContaPagarCentralOmie = require("../../models/integracao/contaPagar/central-omie");
const IntegracaoContaPagarOmieCentral = require("../../models/integracao/contaPagar/omie-central");

const centralOmie = async ({ contaPagar, prestador, ticketId }) => {
  await IntegracaoContaPagarCentralOmie.updateMany(
    {
      contaPagarId: contaPagar?._id,
      arquivado: false,
      etapa: { $in: ["falhas", "reprocessar", "requisicao"] },
    },
    { $set: { arquivado: true, motivoArquivamento: "Duplicidade" } }
  );

  const integracao = await IntegracaoContaPagarCentralOmie.create({
    contaPagarId: contaPagar?._id,
    etapa: "requisicao",
    contaPagar: contaPagar.toObject(),
    prestador: prestador.toObject(),
    ticketId,
  });

  return integracao;
};

const omieCentral = async ({ tipo, requisicao, contaPagar, prestador }) => {
  await IntegracaoContaPagarOmieCentral.updateMany(
    {
      codigo_lancamento_integracao: contaPagar.codigo_lancamento_integracao,
      codigo_lancamento_omie: contaPagar.codigo_lancamento_omie,
      arquivado: false,
      etapa: { $in: ["falhas", "reprocessar", "requisicao"] },
    },
    {
      $set: {
        arquivado: true,
        motivoArquivamento: "Duplicidade",
      },
    }
  );

  const integracao = await IntegracaoContaPagarOmieCentral.create({
    codigo_lancamento_integracao: contaPagar.codigo_lancamento_integracao,
    codigo_lancamento_omie: contaPagar.codigo_lancamento_omie,
    etapa: "requisicao",
    requisicao,
    contaPagar,
    prestador,
    tipo,
  });

  return integracao;
};

module.exports = {
  create: {
    centralOmie,
    omieCentral,
  },
};
