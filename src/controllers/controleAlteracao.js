const ControleAlteracao = require("../models/ControleAlteracao");

const listarTodosRegistros = async (req, res) => {
  try {
    const controleAlteracao =
      await ControleAlteracao.find().populate("usuario");

    if (controleAlteracao.length === 0) {
      return res.status(404).json({ message: "Nenhum registro encontrado!" });
    }

    res.status(200).json(controleAlteracao);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar registros",
      error: error.message,
    });
  }
};

module.exports = {
  listarTodosRegistros,
};
