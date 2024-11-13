const Ticket = require("../models/Ticket");
const BaseOmie = require("../models/BaseOmie");
const { consultar } = require("../services/omie/contaPagarService");

const obterContaPagarOmie = async (req, res) => {
  try {
    const { codigoLancamento } = req.params;
    // console.log("Obtendo conta a pagar Omie:", codigoLancamento);

    const ticket = await Ticket.findOne({ contaPagarOmie: codigoLancamento });
    if (!ticket) {
      return res
        .status(404)
        .json({ mensagem: "Ticket com a conta a pagar não encontrado." });
    }
    // console.log("Ticket encontrado:", ticket);

    const baseOmie = await BaseOmie.findOne();
    // console.log("Base Omie encontrada:", baseOmie);

    const { appKey, appSecret } = baseOmie;
    if (!appKey || !appSecret)
      return res
        .status(400)
        .json({ mensagem: "Credenciais Base Omie não encontradas." });

    // Consultar a conta a pagar na Omie usando o serviço de consulta
    const contaPagarOmie = await consultar(appKey, appSecret, codigoLancamento);
    // console.log("Conta a pagar Omie encontrada:", contaPagarOmie);

    // Verificar se o status do título é "PAGO"
    if (contaPagarOmie.status_titulo === "PAGO") {
      // Alterar o status do ticket para "concluído"
      ticket.status = "concluido";
      ticket.etapa = "concluido";
      await ticket.save();
    }

    return res.status(200).json(contaPagarOmie);
  } catch (error) {
    console.error("Erro ao obter conta a pagar Omie:", error);
    return res.status(500).json({
      mensagem: "Erro ao obter conta a pagar Omie.",
      erro: error.message,
    });
  }
};

module.exports = { obterContaPagarOmie };
