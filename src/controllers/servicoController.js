// src/controllers/servicoController.js
const Servico = require("../models/Servico");
const Ticket = require("../models/Ticket");

exports.createServicoETicket = async (req, res) => {
  const { descricao, data, valor, prestador } = req.body;

  try {
    // Cria um novo documento Servico
    const novoServico = new Servico({
      descricao,
      data,
      valor,
    });

    console.log("novoServico", novoServico);

    await novoServico.save();

    // Cria um novo ticket referenciando o documento Servico
    const novoTicket = new Ticket({
      titulo: "novo serviço: " + descricao,
      etapa: "requisicao",
      status: "aguardando-inicio",
      prestador,
      servico: novoServico._id,
    });
    console.log("novoTicket", novoTicket);

    await novoTicket.save();

    res.status(201).json({
      message: "Serviço e Ticket criados com sucesso!",
      servico: novoServico,
      ticket: novoTicket,
    });
  } catch (error) {
    console.error("Erro ao criar serviço e ticket:", error);
    res.status(500).json({
      message: "Erro ao criar serviço e ticket",
      detalhes: error.message,
    });
  }
};

exports.createServico = async (req, res) => {
  const { descricao, data, valor } = req.body;

  try {
    // Cria um novo documento Servico
    const novoServico = new Servico({
      descricao,
      data,
      valor,
    });

    console.log("novoServico", novoServico);

    await novoServico.save();

    res.status(201).json({
      message: "Serviço criado com sucesso!",
      servico: novoServico,
    });
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    res.status(500).json({
      message: "Erro ao criar serviço",
      detalhes: error.message,
    });
  }
};

exports.updateServico = async (req, res) => {
  const { servicoId } = req.params;
  const { descricao, data, valor } = req.body;

  try {
    const servico = await Servico.findById(servicoId);

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    servico.descricao = descricao;
    servico.data = data;
    servico.valor = valor;

    await servico.save();

    res.status(200).json({
      message: "Serviço atualizado com sucesso!",
      servico,
    });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({
      message: "Erro ao atualizar serviço",
      detalhes: error.message,
    });
  }
};