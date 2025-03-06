// src/controllers/prestadorController.js
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");
const filtersUtils = require("../utils/filter");

// Método para obter prestador pelo idUsuario
exports.obterPrestadorPorIdUsuario = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      usuario: req.params.idUsuario,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Erro ao obter prestador", detalhes: error.message });
  }
};

// obter prestador pelo sid
exports.obterPrestadorPorSid = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ sid: req.params.sid });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.adicionarPrestadorECriarTicket = async (req, res) => {
  // console.log("adicionarPrestadorECriarTicket", req.body);

  try {
    // Adicionar prestador
    const novoPrestador = new Prestador(req.body);
    novoPrestador.status = "em-analise";
    await novoPrestador.save();

    // console.log("novoPrestador", novoPrestador);

    // Criar ticket
    const novoTicket = new Ticket({
      titulo: `Novo Prestador: ${novoPrestador.nome}`,
      etapa: "requisicao",
      status: "aguardando-inicio",
      prestador: novoPrestador._id,
    });
    await novoTicket.save();

    // console.log("novoTicket", novoTicket);

    res.status(201).json({
      message: "Prestador adicionado e ticket criado com sucesso!",
      prestador: novoPrestador,
      ticket: novoTicket,
    });
  } catch (error) {
    // console.error("Erro ao adicionar prestador e criar ticket:", error);
    res.status(500).json({
      message: "Erro ao adicionar prestador e criar ticket",
      detalhes: error.message,
    });
  }
};

// Criar um novo Prestador
exports.criarPrestador = async (req, res) => {
  try {
    const { email, ...rest } = req.body;
    const data = email === "" ? rest : req.body;

    if (req.body?.sciUnico) {
      const prestador = await Prestador.findOne({
        sciUnico: req.body.sciUnico,
      });

      if (prestador) {
        return res.status(409).json({
          message: "Já existe um prestador com esse sciUnico registrado",
        });
      }
    }

    const prestador = new Prestador(data);
    await prestador.save();

    res.status(201).json({
      message: "Prestador criado com sucesso!",
      prestador,
    });
  } catch (error) {
    // console.error("Erro ao criar prestador:", error);
    res.status(500).json({
      message: "Erro ao criar prestador",
      detalhes: error.message,
    });
  }
};

// Listar todos os Prestadores
exports.listarPrestadores = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const schema = Prestador.schema;

    const camposBusca = [
      "email",
      "nome",
      "sid",
      "sciUnico",
      "documento",
      "campanha",
      "status",
      "grossValue",
      "bonus",
    ];

    const queryResult = filtersUtils.buildQuery({
      filtros: rest,
      searchTerm,
      schema,
      camposBusca,
    });

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limit = parseInt(pageSize) || 10;

    const prestadores = await Prestador.find(queryResult)
      .sort(sorting)
      .skip(page * limit)
      .limit(limit);

    const totalDePrestadores = await Prestador.countDocuments(queryResult);

    const totalPages = Math.ceil(totalDePrestadores / limit);

    const response = {
      prestadores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalDePrestadores,
        itemsPerPage: limit,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.log("ERROR", error);
    res.status(400).json({ error: "Erro ao listar prestadores" });
  }
};

// Obter um Prestador por ID
exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
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
    // if (usuario.tipo === "prestador") req.body.status = "em-analise";

    const prestador = await Prestador.findByIdAndUpdate(
      req.params.id,
      req.body
    );

    if (!prestador) {
      return res.status(404).json({ message: "Prestador não encontrado" });
    }

    // if (req.body?.sciUnico) {
    //   const sci = await Prestador.findOne({
    //     sciUnico: req.body.sciUnico,
    //   });

    //   if (sci && sci._id.toString() !== prestador._id.toString()) {
    //     return res.status(409).json({
    //       message: "Já existe um prestador com esse sciUnico registrado",
    //     });
    //   }
    // }

    // // Atualiza apenas os campos fornecidos no corpo da requisição
    // Object.keys(req.body).forEach((key) => {
    //   prestador[key] = req.body[key];
    // });

    // await prestador.save();

    res.status(200).json({
      message: "Prestador atualizado com sucesso!",
      prestador,
    });
  } catch (error) {
    console.error("Erro ao atualizar prestador:", error);
    res.status(500).json({
      message: "Erro ao atualizar prestador",
      detalhes: error.message,
    });
  }
};

// Excluir um Prestador
exports.excluirPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findByIdAndDelete(req.params.id);
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir prestador" });
  }
};

exports.obterPrestadorPorDocumento = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      documento: req.params.documento,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.obterPrestadorPorEmail = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      email: req.params.email,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.obterPrestadorPorPis = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      "pessoaFisica.pis": req.params.pis,
    });

    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};
