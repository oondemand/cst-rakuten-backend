const Ticket = require("../models/Ticket");
const Arquivo = require("../models/Arquivo");

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

    res.status(201).json({
      message: "Ticket criado com sucesso!",
      ticket: ticketPopulado,
    });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).json({
      message: "Erro ao criar ticket",
      detalhes: error.message,
    });
  }
};

exports.updateTicket = async (req, res) => {
  const {
    baseOmieId,
    titulo,
    observacao,
    etapa,
    status,
    servicosIds,
    prestadorId,
  } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        baseOmie: baseOmieId,
        titulo,
        observacao,
        etapa,
        status,
        servicos: servicosIds,
        prestador: prestadorId,
      },
      { new: true, runValidators: true },
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    const ticketPopulado = await Ticket.findById(ticket._id)
      .populate("baseOmie")
      .populate("servicos")
      .populate("prestador");

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
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const filtros = req.query;
    const tickets = await Ticket.find(filtros);

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
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
      .populate("prestador")
      .populate("servicos");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
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

    res.status(200).json({
      message: "Ticket removido com sucesso!",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao remover ticket:", error);
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
      { new: true, runValidators: true },
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.status(200).json({
      message: "Status do ticket atualizado com sucesso!",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao atualizar status do ticket:", error);
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
          nome: file.filename,
          nomeOriginal: file.originalname,
          path: file.path,
          mimetype: file.mimetype,
          size: file.size,
          ticket: ticket._id,
        });
        await arquivo.save();
        return arquivo;
      }),
    );

    ticket.arquivos.push(...arquivosSalvos.map((a) => a._id));
    await ticket.save();

    res.status(201).json({
      message: "Arquivos carregados e associados ao ticket com sucesso!",
      arquivos: arquivosSalvos,
    });
  } catch (error) {
    console.error("Erro ao fazer upload de arquivos:", error);
    res.status(500).json({
      message: "Erro ao fazer upload de arquivos.",
      detalhes: error.message,
    });
  }
};
