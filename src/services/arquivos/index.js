const IntegracaoArquivosCentralOmie = require("../../models/integracao/arquivos/central-omie");
// const IntegracaoPrestadorOmieCentral = require("../../models/integracao/prestador/omie-central");

const centralOmie = async ({
  contaPagar,
  prestador,
  arquivo,
  integracaoContaPagarId,
}) => {
  await IntegracaoArquivosCentralOmie.updateMany(
    {
      contaPagarId: contaPagar?._id,
      integracaoContaPagarId,
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

  const integracao = await IntegracaoArquivosCentralOmie.create({
    etapa: "requisicao",
    contaPagarId: contaPagar?._id,
    prestador: prestador.toObject(),
    integracaoContaPagarId,
    arquivo: arquivo?.toObject(),
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
