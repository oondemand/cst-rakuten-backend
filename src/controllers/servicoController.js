// src/controllers/servicoController.js
const Servico = require("../models/Servico");
const Ticket = require("../models/Ticket");

exports.getServicoById = async (req, res) => {
  const { id } = req.params;

  try {
    const servico = await Servico.findById(id);

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    res.status(200).json(servico);
  } catch (error) {
    console.error("Erro ao obter serviço:", error);
    res.status(500).json({
      message: "Erro ao obter serviço",
      detalhes: error.message,
    });
  }
};

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
  const { descricao, data, valor, status, comentariosRevisao } = req.body;

  try {
    // Cria um novo documento Servico
    const novoServico = new Servico({
      descricao,
      data,
      valor,
      status,
      comentariosRevisao,
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
  const { id } = req.params;
  const { descricao, data, valor, status, comentariosRevisao } = req.body;

  try {
    const servico = await Servico.findById(id);

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    // Atualiza apenas os campos fornecidos no corpo da requisição
    if (descricao !== undefined) servico.descricao = descricao;
    if (data !== undefined) servico.data = data;
    if (valor !== undefined) servico.valor = valor;
    if (status !== undefined) servico.status = status;
    if (comentariosRevisao !== undefined) servico.comentariosRevisao = comentariosRevisao;

    await servico.save();

    // Popula os campos necessários (se houver referências)
    const servicoPopulado = await Servico.findById(servico._id);

    res.status(200).json({
      message: "Serviço atualizado com sucesso!",
      servico: servicoPopulado,
    });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({
      message: "Erro ao atualizar serviço",
      detalhes: error.message,
    });
  }
};
