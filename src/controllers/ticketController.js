const Ticket = require("../models/Ticket");
const Arquivo = require("../models/Arquivo");
const { criarNomePersonalizado } = require("../utils/formatters");
const Prestador = require("../models/Prestador");
const { ControleAlteracaoService } = require("../services/controleAlteracao");
const Servico = require("../models/Servico");
const Sistema = require("../models/Sistema");
const DocumentoFiscal = require("../models/DocumentoFiscal");
const { isEqual } = require("date-fns");
const filterUtils = require("../utils/filter");

exports.createTicket = async (req, res) => {
  const { baseOmieId, titulo, observacao, servicosIds, prestadorId } = req.body;

  try {
    const ticket = new Ticket({
      baseOmie: baseOmieId,
      titulo,
      observacao,
      servicos: servicosIds,
      prestador: prestadorId,
      etapa: "requisicao",
      status: "aguardando-inicio",
    });

    await ticket.save();

    const ticketPopulado = await Ticket.findById(ticket._id)
      .populate("baseOmie")
      .populate("servicos")
      .populate("prestador");

    ControleAlteracaoService.registrarAlteracao({
      acao: "adicionar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(req.body),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(201).json({
      message: "Ticket criado com sucesso!",
      ticket: ticketPopulado,
    });
  } catch (error) {
    // console.error("Erro ao criar ticket:", error);
    res.status(500).json({
      message: "Erro ao criar ticket",
      detalhes: error.message,
    });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    const ticketPopulado = await Ticket.findById(ticket._id)
      .populate("baseOmie")
      .populate("servicos")
      .populate("prestador");

    ControleAlteracaoService.registrarAlteracao({
      acao: "alterar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(req.body),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(200).json({
      message: "Ticket atualizado com sucesso!",
      ticket: ticketPopulado,
    });
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    res.status(500).json({
      message: "Erro ao atualizar ticket",
      detalhes: error.message,
    });
  }
};

exports.getAllByBaseOmie = async (req, res) => {
  try {
    const { baseOmieId } = req.params;
    const tickets = await Ticket.find({ baseOmie: baseOmieId });

    res.status(200).json(tickets);
  } catch (error) {
    // console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const filtros = req.query;
    const tickets = await Ticket.find({
      ...filtros,
      status: { $nin: ["arquivado"] },
    })
      .populate("prestador")
      .populate("servicos")
      .populate("documentosFiscais")
      .populate("arquivos", "nomeOriginal size mimetype tipo")
      .populate("contaPagarOmie");

    res.status(200).json(tickets);
  } catch (error) {
    // console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

exports.getTicketsByPrestadorId = async (req, res) => {
  const { prestadorId } = req.params;

  try {
    const tickets = await Ticket.find({ prestador: prestadorId });

    if (tickets.length === 0) {
      return res.status(200).json([]);
    }

    res.status(200).json(tickets);
  } catch (error) {
    // console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

exports.getTicketsByUsuarioPrestador = async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const prestador = await Prestador.findOne({ usuario: usuarioId });
    const config = await Sistema.findOne();

    if (!prestador) {
      return res
        .status(404)
        .json({ message: "Não foi encontrado um prestador com id fornecido." });
    }

    const tickets = await Ticket.find({
      prestador: prestador._id,
      status: { $ne: "arquivado" },
      etapa: { $ne: "requisicao" },
    })
      .populate("servicos")
      .populate("arquivos", "nomeOriginal size mimetype tipo");

    // Busca serviços abertos não vinculados a tickets
    const servicosAbertos = await Servico.find({
      prestador: prestador._id,
      status: { $in: ["aberto", "pendente"] },
      $or: [
        {
          "competencia.ano": {
            $gt: config.data_corte_app_publisher.getFullYear(),
          },
        },

        {
          $and: [
            {
              "competencia.ano": config.data_corte_app_publisher.getFullYear(),
            },
            {
              "competencia.mes": {
                $gte: config.data_corte_app_publisher.getMonth() + 1, // Ajuste para meses 1-12
              },
            },
          ],
        },
      ],
    }).select("-dataRegistro");

    const servicosPagosExterno = await Servico.aggregate([
      {
        $match: {
          prestador: prestador?._id,
          status: "pago-externo",
          dataRegistro: {
            $exists: true,
            $ne: null,
            $gte: config?.data_corte_app_publisher,
          },
        },
      },
      {
        $addFields: {
          totalValores: {
            $add: [
              { $ifNull: ["$valores.grossValue", 0] },
              { $ifNull: ["$valores.bonus", 0] },
              { $ifNull: ["$valores.ajusteComercial", 0] },
              { $ifNull: ["$valores.paidPlacement", 0] },
            ],
          },
          totalRevisao: {
            $add: [
              { $ifNull: ["$valores.revisionGrossValue", 0] },
              { $ifNull: ["$valores.revisionProvisionBonus", 0] },
              { $ifNull: ["$valores.revisionComissaoPlataforma", 0] },
              { $ifNull: ["$valores.revisionPaidPlacement", 0] },
            ],
          },
        },
      },
      {
        $addFields: {
          valor: {
            $add: [
              "$totalValores",
              "$totalRevisao",
              { $ifNull: ["$valores.imposto", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$dataRegistro",
            },
          },
          servicos: { $push: "$$ROOT" },
          status: { $first: "$status" },
        },
      },
    ]);

    // ticket virtual para serviços abertos
    const fakeTicket = {
      _id: servicosAbertos[0]?._id,
      status: "aberto",
      servicos: servicosAbertos,
      arquivos: [],
      observacao: "Serviço aberto não associado a um ticket",
    };

    // Converte tickets reais para objetos simples e combina com os virtuais
    const allTickets = [
      ...tickets,
      ...(servicosAbertos.length > 0 ? [fakeTicket] : []),
      ...servicosPagosExterno,
    ];

    // Ordenação definitiva considerando todos os cenários
    allTickets.sort((a, b) => {
      // Extrai datas de diferentes cenários
      const getDate = (ticket) => {
        if (ticket.dataRegistro) return ticket.dataRegistro; // Ticket normal
        if (ticket.servicos?.[0]?.dataRegistro)
          return ticket.servicos[0].dataRegistro; // Serviços pagos externos
        return null; // Sem data
      };

      const aDate = getDate(a);
      const bDate = getDate(b);

      // Tickets sem data primeiro
      if (!aDate && !bDate) return 0;
      if (!aDate) return -1;
      if (!bDate) return 1;

      // Datas mais recentes primeiro
      return new Date(bDate) - new Date(aDate);
    });

    let valorTotalRecebido = 0;
    let valorTotalPendente = 0;

    if (allTickets.length === 0) {
      return res
        .status(200)
        .json({ valorTotalRecebido, valorTotalPendente, tickets: [] });
    }

    for (const ticket of allTickets) {
      for (const servico of ticket.servicos) {
        if (["pago", "pago-externo"].includes(servico.status)) {
          valorTotalRecebido += servico.valor;
          continue;
        }

        valorTotalPendente += servico.valor;
      }
    }

    res
      .status(200)
      .json({ valorTotalRecebido, valorTotalPendente, tickets: allTickets });
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("baseOmie")
      .populate("prestador prestador.endereco")
      .populate("servicos");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    // console.error("Erro ao buscar ticket:", error);
    res
      .status(500)
      .json({ message: "Erro ao buscar ticket", detalhes: error.message });
  }
};

exports.deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    ControleAlteracaoService.registrarAlteracao({
      acao: "excluir",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(ticket),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(200).json({
      message: "Ticket removido com sucesso!",
      ticket,
    });
  } catch (error) {
    // console.error("Erro ao remover ticket:", error);
    res.status(500).json({
      message: "Erro ao remover ticket",
      detalhes: error.message,
    });
  }
};

exports.updateStatusTicket = async (req, res) => {
  const { status } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    ControleAlteracaoService.registrarAlteracao({
      acao: "status",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(req.body),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(200).json({
      message: "Status do ticket atualizado com sucesso!",
      ticket,
    });
  } catch (error) {
    // console.error("Erro ao atualizar status do ticket:", error);
    res.status(500).json({
      message: "Erro ao atualizar status do ticket",
      detalhes: error.message,
    });
  }
};

exports.listFilesFromTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const arquivos = await Arquivo.find({ ticket: id });
    res.status(200).json(arquivos);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao listar arquivos do ticket",
      error: error.message,
    });
  }
};

exports.deleteFileFromTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const arquivo = await Arquivo.findByIdAndDelete(id);
    const ticket = await Ticket.findByIdAndUpdate(arquivo.ticket, {
      $pull: { arquivos: id },
    });

    ControleAlteracaoService.registrarAlteracao({
      acao: "alterar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(ticket),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(200).json(arquivo);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar arquivo do ticket",
      error: error.message,
    });
  }
};

exports.uploadFiles = async (req, res) => {
  const ticketId = req.params.id;
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const arquivosSalvos = await Promise.all(
      req.files.map(async (file) => {
        const arquivo = new Arquivo({
          nome: criarNomePersonalizado({ nomeOriginal: file.originalname }),
          nomeOriginal: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          ticket: ticket._id,
          buffer: file.buffer,
        });

        await arquivo.save();
        return arquivo;
      })
    );

    ticket.arquivos.push(...arquivosSalvos.map((a) => a._id));
    await ticket.save();

    ControleAlteracaoService.registrarAlteracao({
      acao: "alterar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: JSON.stringify(ticket),
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.status(201).json({
      message: "Arquivos carregados e associados ao ticket com sucesso!",
      arquivos: arquivosSalvos,
    });
  } catch (error) {
    // console.error("Erro ao fazer upload de arquivos:", error);
    res.status(500).json({
      message: "Erro ao fazer upload de arquivos.",
      detalhes: error.message,
    });
  }
};

exports.getArchivedTickets = async (req, res) => {
  try {
    const {
      ["prestador.sid"]: prestadorSid,
      ["prestador.nome"]: prestadorNome,
      ["prestador.tipo"]: prestadorTipo,
      ["prestador.documento"]: prestadorDocumento,
      status,
      searchTerm = "",
      sortBy,
      pageIndex,
      pageSize,
      ...rest
    } = req.query;

    const prestadorFiltersQuery = filterUtils.queryFiltros({
      filtros: {
        sid: prestadorSid,
        nome: prestadorNome,
        tipo: prestadorTipo,
        documento: prestadorDocumento,
      },
      schema: Prestador.schema,
    });

    const prestadoresQuerySearchTerm = filterUtils.querySearchTerm({
      schema: Prestador.schema,
      searchTerm,
      camposBusca: ["nome", "tipo", "documento", "sid"],
    });

    let prestadoresIds = [];

    if (
      Object.keys(prestadorFiltersQuery).length > 0 ||
      Object.keys(prestadoresQuerySearchTerm).length > 0
    ) {
      prestadoresIds = await Prestador.find({
        $and: [prestadorFiltersQuery, { $or: [prestadoresQuerySearchTerm] }],
      }).select("_id");
    }

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    const filtersQuery = filterUtils.queryFiltros({
      filtros: rest,
      schema: Ticket.schema,
    });

    const searchTermCondition = filterUtils.querySearchTerm({
      searchTerm,
      schema: Ticket.schema,
      camposBusca: ["titulo", "createdAt"],
    });

    const queryResult = {
      $and: [
        filtersQuery,
        { status: "arquivado" },
        {
          $or: [
            ...(Object.keys(searchTermCondition).length > 0
              ? [searchTermCondition]
              : []),
            ...prestadorConditions,
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

    const [tickets, totalDeTickets] = await Promise.all([
      Ticket.find(queryResult)
        .populate("prestador", "sid nome documento")
        .populate({
          path: "servicos",
          options: { virtuals: true },
        })
        .skip(skip)
        .limit(limite),
      Ticket.countDocuments(queryResult),
    ]);

    res.status(200).json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeTickets / limite),
        totalItems: totalDeTickets,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    // console.log(error);

    res.status(500).json({
      message: "Erro ao buscar tickets arquivados",
      detalhes: error.message,
    });
  }
};

exports.getTicketsPago = async (req, res) => {
  try {
    const {
      ["prestador.sid"]: prestadorSid,
      ["prestador.nome"]: prestadorNome,
      ["prestador.tipo"]: prestadorTipo,
      ["prestador.documento"]: prestadorDocumento,
      status,
      searchTerm = "",
      sortBy,
      pageIndex,
      pageSize,
      ...rest
    } = req.query;

    const prestadorFiltersQuery = filterUtils.queryFiltros({
      filtros: {
        sid: prestadorSid,
        nome: prestadorNome,
        tipo: prestadorTipo,
        documento: prestadorDocumento,
      },
      schema: Prestador.schema,
    });

    const prestadoresQuerySearchTerm = filterUtils.querySearchTerm({
      schema: Prestador.schema,
      searchTerm,
      camposBusca: ["nome", "tipo", "documento", "sid"],
    });

    const prestadoresIds = await Prestador.find({
      $and: [prestadorFiltersQuery, { $or: [prestadoresQuerySearchTerm] }],
    }).select("_id");

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    const filtersQuery = filterUtils.queryFiltros({
      filtros: rest,
      schema: Ticket.schema,
    });

    const searchTermCondition = filterUtils.querySearchTerm({
      searchTerm,
      schema: Ticket.schema,
      camposBusca: ["titulo", "createdAt"],
    });

    const queryResult = {
      $and: [
        {
          status: "concluido",
          etapa: "concluido",
        },
        { ...filtersQuery, status: "concluido", etapa: "concluido" },
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

    const [tickets, totalDeTickets] = await Promise.all([
      Ticket.find(queryResult)
        .populate("prestador", "sid nome documento")
        .populate("arquivos", "nomeOriginal size mimetype tipo")
        .populate({
          path: "servicos",
          options: { virtuals: true },
        })
        .skip(skip)
        .limit(limite)
        .sort(sorting),
      Ticket.countDocuments(queryResult),
    ]);

    res.status(200).json({
      tickets,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeTickets / limite),
        totalItems: totalDeTickets,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    // console.log(error);

    res.status(500).json({
      message: "Erro ao buscar tickets arquivados",
      detalhes: error.message,
    });
  }
};

exports.getArquivoPorId = async (req, res) => {
  try {
    const arquivo = await Arquivo.findById(req.params.id);
    res.status(200).json(arquivo);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar arquivo!",
      detalhes: error.message,
    });
  }
};

exports.addServico = async (req, res) => {
  try {
    const { ticketId, servicoId } = req.params;
    const servico = await Servico.findById(servicoId);
    const ticket = await Ticket.findById(ticketId);

    if (
      ticket?.dataRegistro &&
      !isEqual(servico?.dataRegistro, ticket?.dataRegistro)
    ) {
      return res.status(400).json({ message: "Data registro conflitante." });
    }

    ticket.dataRegistro = servico?.dataRegistro;
    ticket.servicos = [...ticket?.servicos, servico?._id];
    await ticket.save();

    servico.status = "processando";
    await servico.save();

    const populatedTicket = await Ticket.findById(ticket._id).populate(
      "servicos"
    );

    return res.status(200).json(populatedTicket);
  } catch (error) {
    return res.status(500).json();
  }
};

exports.removeServico = async (req, res) => {
  try {
    const { servicoId } = req.params;
    await Servico.findByIdAndUpdate(
      servicoId,
      { status: "aberto" },
      { new: true }
    );

    const ticket = await Ticket.findOneAndUpdate(
      { servicos: servicoId }, // Busca o ticket que contém este serviço
      { $pull: { servicos: servicoId } }, // Remove o serviço do array
      { new: true }
    ).populate("servicos");

    if (ticket?.servicos.length === 0) {
      ticket.dataRegistro = null;
      await ticket.save();
    }

    return res.status(200).json(ticket);
  } catch (error) {
    // console.log(error);
    return res.status(500).json();
  }
};

exports.addDocumentoFiscal = async (req, res) => {
  try {
    const { ticketId, documentoFiscalId } = req.params;
    const documentoFiscal = await DocumentoFiscal.findById(documentoFiscalId);
    const ticket = await Ticket.findById(ticketId);

    ticket.documentosFiscais = [
      ...ticket?.documentosFiscais,
      documentoFiscal?._id,
    ];

    await ticket.save();

    documentoFiscal.status = "processando";
    await documentoFiscal.save();

    const populatedTicket = await Ticket.findById(ticket._id).populate(
      "documentosFiscais"
    );

    return res.status(200).json(populatedTicket);
  } catch (error) {
    return res.status(500).json();
  }
};

exports.removeDocumentoFiscal = async (req, res) => {
  try {
    const { documentoFiscalId } = req.params;
    await DocumentoFiscal.findByIdAndUpdate(
      documentoFiscalId,
      { status: "pendente" },
      { new: true }
    );

    const ticket = await Ticket.findOneAndUpdate(
      { documentosFiscais: documentoFiscalId }, // Busca o ticket que contém este serviço
      { $pull: { documentosFiscais: documentoFiscalId } }, // Remove o serviço do array
      { new: true }
    ).populate("documentosFiscais");

    // if (ticket?.documentosFiscais.length === 0) {
    //   ticket.dataRegistro = null;
    //   await ticket.save();
    // }

    return res.status(200).json(ticket);
  } catch (error) {
    // console.log(error);
    return res.status(500).json();
  }
};
