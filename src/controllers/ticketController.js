const Ticket = require("../models/Ticket");

// Cria um novo ticket
exports.createTicket = async (req, res) => {
  const { baseOmie, titulo, observacao } = req.body;

  try {
    // Cria o novo ticket
    const ticket = new Ticket({
      baseOmie,
      titulo,
      observacao,
      etapa: "requisicao",
      status: "aguardando-inicio",
    });

    await ticket.save();

    res.status(201).json({
      message: "Ticket criado com sucesso!",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao criar ticket:", error);
    res.status(500).json({
      message: "Erro ao criar ticket",
      detalhes: error.message,
    });
  }
};

// Obtém todos os tickets
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

// Obtém todos os tickets
exports.getAllTickets = async (req, res) => {
  try {
    // Busca todos os tickets sem filtro inicialmente
    const tickets = await Ticket.find({})

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Erro ao buscar tickets:", error);
    res.status(500).json({
      message: "Erro ao buscar tickets",
      detalhes: error.message,
    });
  }
};

// Obtém todos os tickets pelo idUsuario
exports.getTicketsByPrestadorId = async (req, res) => {
  const { prestadorId } = req.params;
  console.log("prestadorId", prestadorId);

  try {
    // Busca todos os tickets pelo idUsuario
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

// Obtém um ticket específico pelo ID
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }
    res.status(200).json(ticket);
  } catch (error) {
    console.error("Erro ao buscar ticket:", error);
    res.status(500).json({
      message: "Erro ao buscar ticket",
      detalhes: error.message,
    });
  }
};

// Atualiza um ticket existente
exports.updateTicket = async (req, res) => {
  const { titulo, observacao, etapa, status } = req.body;

  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { titulo, observacao, etapa, status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.status(200).json({
      message: "Ticket atualizado com sucesso!",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao atualizar ticket:", error);
    res.status(500).json({
      message: "Erro ao atualizar ticket",
      detalhes: error.message,
    });
  }
};

// Remove um ticket
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
      { new: true, runValidators: true }
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

// Função para associar um arquivo ao ticket
exports.associarArquivoAoTicket = async (req, res) => {
  try {
    const { id, arquivoId } = req.params;

    // Verificar se o ticket existe
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    // Verificar se o arquivo existe
    const arquivo = await Arquivo.findById(arquivoId);
    if (!arquivo) {
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }

    // Associar o arquivo ao ticket
    ticket.arquivos.push(arquivo._id);
    await ticket.save();

    res.status(200).json({ message: "Arquivo associado ao ticket com sucesso", ticket });
  } catch (error) {
    res.status(500).json({ message: "Erro ao associar arquivo ao ticket", error: error.message });
  }
};

// Função para listar arquivos de um ticket
exports.listarArquivosDoTicket = async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await Ticket.findById(id).populate("arquivos");
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    res.status(200).json(ticket.arquivos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar arquivos do ticket", error: error.message });
  }
};
