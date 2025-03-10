const Estado = require("../models/Estado");

exports.createEstado = async (req, res) => {
  try {
    const { nome, sigla } = req.body;

    const estadoExiste = await Estado.findOne({
      $or: [{ nome }, { sigla }],
    });

    if (estadoExiste) {
      return res.status(400).json({
        message: "Estado já cadastrado com esse nome ou sigla",
      });
    }

    const novoEstado = await Estado.create({ nome, sigla });
    res.status(201).json(novoEstado);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao criar estado", error: error.message });
  }
};

exports.getAllEstados = async (req, res) => {
  try {
    const estados = await Estado.find().sort({ nome: 1 });
    res.json(estados);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar estados", error: error.message });
  }
};

exports.getEstadoById = async (req, res) => {
  try {
    const estado = await Estado.findById(req.params.id);
    if (!estado) {
      return res.status(404).json({ message: "Estado não encontrado" });
    }
    res.json(estado);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao buscar estado", error: error.message });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const estado = await Estado.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!estado) {
      return res.status(404).json({ message: "Estado não encontrado" });
    }
    res.json(estado);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao atualizar estado", error: error.message });
  }
};

exports.deleteEstado = async (req, res) => {
  try {
    const estado = await Estado.findByIdAndDelete(req.params.id);
    if (!estado) {
      return res.status(404).json({ message: "Estado não encontrado" });
    }
    res.json({ message: "Estado excluído com sucesso" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Erro ao excluir estado", error: error.message });
  }
};
