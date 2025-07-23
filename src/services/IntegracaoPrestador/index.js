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

const omieCentral = async () => {
  // await IntegracaoPrestadorOmieCentral.updateMany(
  //   {
  //     prestadorId: prestador._id,
  //     arquivado: false,
  //     etapa: { $in: ["falhas", "reprocessar", "requisicao"] },
  //   },
  //   {
  //     $set: {
  //       arquivado: true,
  //       motivoArquivamento: "Duplicidade",
  //     },
  //   }
  // );

  const integracao = await IntegracaoPrestadorOmieCentral.create({
    // prestadorId: prestador._id,
    etapa: "requisicao",
    // prestador: prestador.toObject(),
  });

  return integracao;
};

module.exports = {
  create: {
    centralOmie,
    omieCentral,
  },
};
