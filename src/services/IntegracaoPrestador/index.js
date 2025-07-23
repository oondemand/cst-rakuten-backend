const IntegracaoPrestadorCentralOmie = require("../../models/integracao/prestador/central-omie");
const IntegracaoPrestadorOmieCentral = require("../../models/integracao/prestador/omie-central");

const centralOmie = async ({ prestador }) => {
  await IntegracaoPrestadorCentralOmie.updateMany(
    {
      prestadorId: prestador._id,
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

  const integracao = await IntegracaoPrestadorCentralOmie.create({
    prestadorId: prestador._id,
    etapa: "requisicao",
    prestador: prestador.toObject(),
  });

  return integracao;
};

const omieCentral = async ({ payload, prestador }) => {
  await IntegracaoPrestadorOmieCentral.updateMany(
    {
      codigo_cliente_omie: prestador.codigo_cliente_omie,
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

  const integracao = await IntegracaoPrestadorOmieCentral.create({
    codigo_cliente_omie: prestador.codigo_cliente_omie,
    payload,
    etapa: "requisicao",

    prestador: prestador,
  });

  return integracao;
};

module.exports = {
  create: {
    centralOmie,
    omieCentral,
  },
};
