const IntegracaoPrestador = require("../../models/IntegracaoPrestador");

const integracaoPrestadorOmieCentralPorEtapa = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $match: {
          arquivado: false, // opcional: só contar os não arquivados
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

    const response = await IntegracaoPrestador.aggregate(aggregationPipeline);
    return res.status(200).json(response);
  } catch (error) {
    console.error("Erro ao agrupar por etapa:", error);
    res.status(500).json({ message: "Ocorreu um erro inesperado" });
  }
};

module.exports = {
  integracaoPrestadorOmieCentralPorEtapa,
};
