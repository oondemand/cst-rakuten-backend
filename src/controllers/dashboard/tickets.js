const Ticket = require("../../models/Ticket");

exports.ticketsPorStatus = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          status: "$_id",
          count: 1,
        },
      },
    ];

    const response = await Ticket.aggregate(aggregationPipeline);
    return res.status(200).json(response);
  } catch (error) {
    // console.log("Error", error);
    res.status(500).json({ message: "Ouve um erro inesperado" });
  }
};

exports.ticketsPorEtapa = async (req, res) => {
  try {
    const aggregationPipeline = [
      {
        $match: {
          status: { $ne: "arquivado" },
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

    const response = await Ticket.aggregate(aggregationPipeline);
    return res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: "Ouve um erro inesperado" });
  }
};
