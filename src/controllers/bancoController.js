const Banco = require("../models/Banco");

exports.listarBancos = async (req, res) => {
  try {
    const bancos = await Banco.find({});
    res.status(200).json(bancos);
  } catch (error) {
    res
      .status(500)
      .json({ mensagem: "Erro ao listar bancos", erro: error.message });
  }
};
