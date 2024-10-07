// src/controllers/prestadorController.js
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");

// Método para obter prestador pelo idUsuario
exports.obterPrestadorPorIdUsuario = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ usuario: req.params.idUsuario });
    if (!prestador) return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter prestador", detalhes: error.message });
  }
};

exports.adicionarPrestadorECriarTicket = async (req, res) => {
  console.log("adicionarPrestadorECriarTicket", req.body);

  try {
    // Adicionar prestador
    const novoPrestador = new Prestador(req.body);
    novoPrestador.status = "em-analise";
    await novoPrestador.save();

    // Criar ticket
    const novoTicket = new Ticket({
      titulo: `Novo Prestador: ${novoPrestador.nome}`,
      etapa: "requisicao",
      status: "aguardando-inicio",
      prestador: novoPrestador._id,
    });
    await novoTicket.save();

    res.status(201).json({ prestador: novoPrestador, ticket: novoTicket });
  } catch (error) {
    console.log("Erro ao adicionar prestador e criar ticket", error);
    res
      .status(400)
      .json({ error: "Erro ao adicionar prestador e criar ticket", detalhes: error.message });
  }
};

// Criar um novo Prestador
exports.criarPrestador = async (req, res) => {
  try {
    const prestador = new Prestador(req.body);
    await prestador.save();
    res.status(201).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao criar prestador", detalhes: error.message });
  }
};

// Pesquisar Prestador por tipo e documento
exports.pesquisarPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      tipo: req.body.tipo,
      documento: req.body.documento,
    });
    if (!prestador) return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao pesquisar prestador" });
  }
};

// Listar todos os Prestadores
exports.listarPrestadores = async (req, res) => {
  try {
    const prestadores = await Prestador.find();
    res.status(200).json(prestadores);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar prestadores" });
  }
};

// Obter um Prestador por ID
exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);
    if (!prestador) return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter prestador" });
  }
};

// Atualizar um Prestador
exports.atualizarPrestador = async (req, res) => {
  try {
    const usuario = req.usuario;

    // Verificar se o tipo de usuário é "prestador"
    if (usuario.tipo === "prestador") req.body.status = "em-analise";

    const prestador = await Prestador.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!prestador) {
      return res.status(404).json({ error: "Prestador não encontrado" });
    }

    res.status(200).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar prestador", detalhes: error.message });
  }
};

// Excluir um Prestador
exports.excluirPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findByIdAndDelete(req.params.id);
    if (!prestador) return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir prestador" });
  }
};
