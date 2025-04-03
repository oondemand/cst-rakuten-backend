const Servico = require("../../models/Servico");

exports.valoresPorStatus = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $group: {
          _id: "$status",
          total: {
            $sum: {
              $add: [
                { $ifNull: ["$valores.grossValue", 0] },
                { $ifNull: ["$valores.bonus", 0] },
                { $ifNull: ["$valores.ajusteComercial", 0] },
                { $ifNull: ["$valores.paidPlacement", 0] },
                { $ifNull: ["$valores.revisionGrossValue", 0] },
                { $ifNull: ["$valores.revisionProvisionBonus", 0] },
                { $ifNull: ["$valores.revisionComissaoPlataforma", 0] },
                { $ifNull: ["$valores.revisionPaidPlacement", 0] },
                { $ifNull: ["$valores.imposto", 0] },
              ],
            },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          total: 1,
          count: 1,
        },
      },
    ];

    const response = await Servico.aggregate(aggregationPipeline);
    return res.status(200).json(response);
  } catch (error) {
    console.log("Error", error);
    res.status(500).json({ message: "Ouve um erro inesperado" });
  }
};
