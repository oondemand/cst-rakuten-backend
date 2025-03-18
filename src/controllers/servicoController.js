// src/controllers/servicoController.js
const Servico = require("../models/Servico");
const Prestador = require("../models/Prestador");
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
      status: "aberto",
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

    const novoServico = new Servico({ ...filteredBody, status: "aberto" });
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
      "tipoDocumentoFiscal",
      "valores.grossValue",
      "competencia.mes",
      "competencia.ano",
      "valores.bonus",
      "valor",
      "campanha",
      "status",
    ];

    // procura ids dos prestadores pelo nome documento e sid
    const prestadoresIds = await Prestador.find({
      $or: [
        { nome: { $regex: searchTerm, $options: "i" } },
        {
          ...(!isNaN(Number(searchTerm))
            ? { documento: Number(searchTerm) }
            : {}),
        },
        { ...(!isNaN(Number(searchTerm)) ? { sid: Number(searchTerm) } : {}) },
      ],
    }).select("_id");

    // monta a query que ira buscar os prestadores pelos ids referentes
    const queryResult = {
      $and: [
        filtersUtils.buildQuery({ filtros: rest, schema }),
        {
          $or: [
            filtersUtils.querySearchTerm({
              searchTerm,
              schema,
              camposBusca,
            }),

            ...(prestadoresIds.length > 0
              ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
              : []),
          ],
        },
      ],
    };

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const [servicos, totalDeServicos] = await Promise.all([
      Servico.find(queryResult)
        .populate("prestador", "sid nome documento")
        .skip(skip)
        .limit(limite),
      Servico.countDocuments(queryResult),
    ]);

    res.status(200).json({
      servicos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeServicos / limite),
        totalItems: totalDeServicos,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao listar servicoes" });
  }
};

exports.listarServicoPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const servicos = await Servico.find({
      prestador: prestadorId,
      status: "aberto",
    }).populate("prestador", "sid nome documento");

    res.status(200).json(servicos);
  } catch (error) {
    console.error("Erro na listagem:", error);
    res
      .status(400)
      .json({ error: "Falha ao buscar serviços", details: error.message });
  }
};

exports.excluirServico = async (req, res) => {
  try {
    const servicoId = req.params.id;

    await Ticket.updateMany(
      { servicos: servicoId },
      { $pull: { servicos: servicoId } }
    );

    const servico = await Servico.findByIdAndDelete(servicoId);

    if (!servico)
      return res.status(404).json({ error: "Servico não encontrado" });

    res.status(200).json({ data: servico });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir servico" });
  }
};
