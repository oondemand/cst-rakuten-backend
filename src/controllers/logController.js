const Log = require("../models/Log");

// Listar todos os logs
const listarTodosLogs = async (req, res) => {
  try {
    const logs = await Log.find().populate("usuario", "nome email").sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar logs", error: error.message });
  }
};

// Listar logs por usuário (filtrar por usuário específico)
const listarLogsPorUsuario = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const logs = await Log.find({ usuario: usuarioId }).populate("usuario", "nome email").sort({ createdAt: -1 });

    if (logs.length === 0) {
      return res.status(404).json({ message: "Nenhum log encontrado para este usuário" });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar logs por usuário", error: error.message });
  }
};

// Filtrar logs por endpoint e método HTTP (opcional)
const filtrarLogs = async (req, res) => {
  const { endpoint, metodo } = req.query;

  try {
    const query = {};

    if (endpoint) {
      query.endpoint = { $regex: endpoint, $options: "i" }; // Busca o endpoint ignorando maiúsculas/minúsculas
    }

    if (metodo) {
      query.metodo = metodo.toUpperCase(); // Certifica-se de que o método HTTP é em maiúsculas
    }

    const logs = await Log.find(query).populate("usuario", "nome email").sort({ createdAt: -1 });

    if (logs.length === 0) {
      return res.status(404).json({ message: "Nenhum log encontrado com os critérios especificados" });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar logs com os filtros especificados", error: error.message });
  }
};

module.exports = {
  listarTodosLogs,
  listarLogsPorUsuario,
  filtrarLogs,
};
