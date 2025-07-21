const IntegracaoPrestador = require("../../models/IntegracaoPrestador");

const create = async ({ prestador }) => {
  await IntegracaoPrestador.updateMany(
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

  const integracao = await IntegracaoPrestador.create({
    prestadorId: prestador._id,
    etapa: "requisicao",
    payload: { prestador },
    prestador: prestador.toObject(),
  });

  return integracao;
};

module.exports = {
  create,
};
