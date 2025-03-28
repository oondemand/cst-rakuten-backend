const Servico = require("../../models/Servico");
const Ticket = require("../../models/Ticket");

exports.sincronizarEsteira = async (req, res) => {
  try {
    const servicos = await Servico.find({
      status: "pendente",
    }).populate("prestador", "nome");

    const etapasValidas = [
      "requisicao",
      "aprovacao-cadastro",
      "geracao-rpa",
      "aprovacao-fiscal",
    ];

    for (const servico of servicos) {
      let ticket = await Ticket.findOneAndUpdate(
        {
          prestador: servico.prestador._id,
          etapa: { $in: etapasValidas },
          dataRegistro: servico?.dataRegistro,
          status: { $ne: "arquivado" },
        },
        { $push: { servicos: servico._id } },
        { new: true }
      );

      if (!ticket) {
        ticket = await Ticket.findOneAndUpdate(
          {
            prestador: servico.prestador._id,
            etapa: { $in: etapasValidas },
            dataRegistro: { $in: [null, ""] },
            status: { $ne: "arquivado" },
          },
          {
            $push: { servicos: servico._id },
            dataRegistro: servico?.dataRegistro,
          },
          { new: true }
        );
      }

      if (!ticket) {
        ticket = new Ticket({
          prestador: servico.prestador._id,
          titulo: `Comissão ${servico.prestador.nome}`,
          servicos: [servico._id],
          etapa: "requisicao",
          dataRegistro: servico?.dataRegistro,
        });
      }

      await ticket.save();
      servico.status = "processando";
      await servico.save();
    }

    return res.status(200).json({ message: "Esteira sincronizada" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
