// src/controllers/servicoController.js
const Servico = require("../models/Servico");
const Ticket = require("../models/Ticket");
const filtersUtils = require("../utils/filter");

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
    // console.error("Erro ao obter serviço:", error);
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

    // console.log("novoServico", novoServico);

    await novoServico.save();

    // Cria um novo ticket referenciando o documento Servico
    const novoTicket = new Ticket({
      titulo: "novo serviço: " + descricao,
      etapa: "requisicao",
      status: "aguardando-inicio",
      prestador,
      servico: novoServico._id,
    });
    // console.log("novoTicket", novoTicket);

    await novoTicket.save();

    res.status(201).json({
      message: "Serviço e Ticket criados com sucesso!",
      servico: novoServico,
      ticket: novoTicket,
    });
  } catch (error) {
    // console.error("Erro ao criar serviço e ticket:", error);
    res.status(500).json({
      message: "Erro ao criar serviço e ticket",
      detalhes: error.message,
    });
  }
};

exports.createServico = async (req, res) => {
  try {
    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoServico = new Servico(filteredBody);
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
  const updateData = req.body;

  try {
    const servico = await Servico.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    res.status(200).json({
      message: "Serviço atualizado com sucesso!",
      servico: servico,
    });
  } catch (error) {
    // console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({
      message: "Erro ao atualizar serviço",
      detalhes: error.message,
    });
  }
};

  exports.listarServicos = async (req, res) => {
    try {
      const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

      const schema = Servico.schema;

      const camposBusca = [
        "valor",
        "prestador.nome",
        "prestador.sid",
        "prestador.documento",
        "campanha",
        "status",
        "valores.grossValue",
        "valores.bonus",
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

      const servicos = await Servico.find(queryResult)
        .populate("prestador", "sid nome documento")
        .sort(sorting)
        .skip(page * limit)
        .limit(limit);

      const totalDeServicos = await Servico.countDocuments(queryResult);

      const totalPages = Math.ceil(totalDeServicos / limit);

      const response = {
        servicos,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalDeServicos,
          itemsPerPage: limit,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.log(error);
      res.status(400).json({ error: "Erro ao listar servicoes" });
    }
  };

exports.excluirServico = async (req, res) => {
  try {
    const servico = await Servico.findByIdAndDelete(req.params.id);
    if (!servico)
      return res.status(404).json({ error: "Servico não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir servico" });
  }
};
