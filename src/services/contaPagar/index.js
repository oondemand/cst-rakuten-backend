const IntegracaoContaPagarCentralOmie = require("../../models/integracao/contaPagar/central-omie");
// const IntegracaoPrestadorOmieCentral = require("../../models/integracao/prestador/omie-central");

const centralOmie = async ({ contaPagar, prestador, ticketId }) => {
  await IntegracaoContaPagarCentralOmie.updateMany(
    {
      contaPagarId: contaPagar?._id,
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

  const integracao = await IntegracaoContaPagarCentralOmie.create({
    contaPagarId: contaPagar?._id,
    etapa: "requisicao",
    contaPagar: contaPagar.toObject(),
    prestador: prestador.toObject(),
    ticketId,
  });

  return integracao;
};

// const omieCentral = async ({ payload, prestador }) => {
//   await IntegracaoPrestadorOmieCentral.updateMany(
//     {
//       codigo_cliente_omie: prestador.codigo_cliente_omie,
//       arquivado: false,
//       etapa: { $in: ["falhas", "reprocessar", "requisicao"] },
//     },
//     {
//       $set: {
//         arquivado: true,
//         motivoArquivamento: "Duplicidade",
//       },
//     }
//   );

//   const integracao = await IntegracaoPrestadorOmieCentral.create({
//     codigo_cliente_omie: prestador.codigo_cliente_omie,
//     payload,
//     etapa: "requisicao",

//     prestador: prestador,
//   });

//   return integracao;
// };

module.exports = {
  create: {
    centralOmie,
    // omieCentral,
  },
};
