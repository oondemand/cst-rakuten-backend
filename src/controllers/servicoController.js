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
    const servico = await Servico.findById(id);

    if (!servico) {
      return res.status(404).json({
        message: "Serviço não encontrado",
      });
    }

    if (["pago", "pago-externo", "processando"].includes(servico.status)) {
      return res.status(400).json({
        message:
          "Não é possível atualizar um serviço pago ou em processamento.",
      });
    }

    const servicoAtualizado = await Servico.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    res.status(200).json({
      message: "Serviço atualizado com sucesso!",
      servico: servicoAtualizado,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar serviço",
      detalhes: error.message,
    });
  }
};

exports.listarServicos = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const prestadoresQuery = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Prestador.schema,
      camposBusca: ["sid", "documento", "nome"],
    });

    // Busca ids de prestadores com base nas condições criadas de acordo ao search term
    const prestadoresIds = await Prestador.find(prestadoresQuery).select("_id");

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema: Servico.schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Servico.schema,
      camposBusca: [
        "notaFiscal",
        "dataProvisaoContabil",
        "dataRegistro",
        "campanha",
        "tipoDocumentoFiscal",
        "competencia",
        "valores.grossValue",
        "valores.bonus",
        "valores.ajusteComercial",
        "valores.paidPlacement",
        "valores.revisionMonthProvision",
        "valores.revisionGrossValue",
        "valores.revisionProvisionBonus",
        "valores.revisionComissaoPlataforma",
        "valores.revisionPaidPlacement",
        "valor",
      ],
    });

    const queryResult = {
      $and: [
        filterFromFiltros,
        { $or: [searchTermCondition, ...prestadorConditions] },
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
        .populate("prestador", "sid nome documento tipo")
        .skip(skip)
        .limit(limite)
        .sort(sorting),
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
    // console.log(error);
    res.status(400).json({ error: "Erro ao listar servicoes" });
  }
};

exports.listarServicoPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;
    const { dataRegistro } = req.query;

    const servicos = await Servico.find({
      prestador: prestadorId,
      status: "aberto",
      ...(dataRegistro ? { dataRegistro: dataRegistro } : {}),
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

exports.atualizarStatus = async (req, res) => {
  const { ids, status } = req.body;

  try {
    const result = await Servico.updateMany(
      { _id: { $in: ids } },
      { $set: { status: status } }
    );

    res.status(200).json({
      message: "Serviço atualizado com sucesso!",
      servicos: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar serviço",
      detalhes: error.message,
    });
  }
};
