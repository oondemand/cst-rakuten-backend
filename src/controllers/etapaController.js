const Etapa = require("../models/Etapa");

// Função para criar uma nova etapa
exports.criarEtapa = async (req, res) => {
  try {
    const etapa = new Etapa(req.body);
    await etapa.save();
    res.status(201).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar etapa" });
  }
};

// Função para listar todas as etapas
exports.listarEtapas = async (req, res) => {
  try {
    const etapas = await Etapa.find();
    res.status(200).json(etapas);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar etapas" });
  }
};

exports.listarEtapasAtivas = async (req, res) => {
  try {
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    res.status(200).json(etapas);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar etapas" });
  }
};

// Função para obter uma etapa por ID
exports.obterEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findById(req.params.id);
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter etapa" });
  }
};

// Função para atualizar uma etapa por ID
exports.atualizarEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json(etapa);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar etapa" });
  }
};

// Função para excluir uma etapa por ID
exports.excluirEtapa = async (req, res) => {
  try {
    const etapa = await Etapa.findByIdAndDelete(req.params.id);
    if (!etapa) {
      return res.status(404).json({ error: "Etapa não encontrada" });
    }
    res.status(200).json({ message: "Etapa excluída com sucesso" });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir etapa" });
  }
};
