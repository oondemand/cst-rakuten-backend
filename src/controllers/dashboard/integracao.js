const IntegracaoPrestadorCentralOmie = require("../../models/integracao/prestador/central-omie");
const IntegracaoPrestadorOmieCentral = require("../../models/integracao/prestador/omie-central");

const IntegracaoContaPagarCentralOmie = require("../../models/integracao/contaPagar/central-omie");
const IntegracaoContaPagarOmieCentral = require("../../models/integracao/contaPagar/omie-central");

const IntegracaoArquivosOmieCentral = require("../../models/integracao/arquivos/central-omie");

const integracaoPrestadorOmieCentralPorEtapa = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $match: {
          arquivado: false,
        },
      },
      {
        $group: {
          _id: "$etapa",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          etapa: "$_id",
          count: 1,
        },
      },
    ];

    const prestadorCentralOmie =
      await IntegracaoPrestadorCentralOmie.aggregate(aggregationPipeline);

    const prestadorOmieCentral =
      await IntegracaoPrestadorOmieCentral.aggregate(aggregationPipeline);

    const contaPagarCentralOmie =
      await IntegracaoContaPagarCentralOmie.aggregate(aggregationPipeline);

    const contaPagarOmieCentral =
      await IntegracaoContaPagarOmieCentral.aggregate(aggregationPipeline);

    const arquivosCentralOmie =
      await IntegracaoArquivosOmieCentral.aggregate(aggregationPipeline);

    const integracao = {
      prestador: {
        omieCentral: prestadorOmieCentral,
        centralOmie: prestadorCentralOmie,
      },
      contaPagar: {
        centralOmie: contaPagarCentralOmie,
        omieCentral: contaPagarOmieCentral,
      },
      anexos: {
        centralOmie: arquivosCentralOmie,
      },
    };

    return res.status(200).json(integracao);
  } catch (error) {
    console.error("Erro ao agrupar por etapa:", error);
    res.status(500).json({ message: "Ocorreu um erro inesperado" });
  }
};

module.exports = {
  integracaoPrestadorOmieCentralPorEtapa,
};
