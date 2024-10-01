const Ticket = require("../models/Ticket");
const Nfse = require("../models/Nfse");

// Cria um novo ticket
exports.createTicket = async (req, res) => {
  const { titulo, observacao, etapa, status, nfse } = req.body;

  try {
    // Verifica se a NFS-e existe
    const nfseExists = await Nfse.findById(nfse);
    if (!nfseExists) {
      return res.status(404).json({ message: "NFS-e não encontrada" });
    }

    // Cria o novo ticket
    const ticket = new Ticket({
      titulo,
      observacao,
      etapa,
      status,
      nfse,
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
exports.getAllTickets = async (req, res) => {
  try {
    // Obtenha o CNPJ do tomador dos parâmetros de consulta
    const { cnpjTomador } = req.query;

    // Busca todos os tickets sem filtro inicialmente
    const tickets = await Ticket.find({}).populate("nfse");

    // Se houver tickets e CNPJ do tomador, aplique o filtro em memória
    if (tickets.length > 0 && cnpjTomador) {
      const ticketsFiltrados = tickets.filter((ticket) => {
        // Verifica se o campo tomador e o documento existem
        return (
          ticket.nfse &&
          ticket.nfse.infoNfse &&
          ticket.nfse.infoNfse.tomador &&
          ticket.nfse.infoNfse.tomador.documento === cnpjTomador.trim()
        );
      });

      if (ticketsFiltrados.length === 0) {
        return res.status(200).json([]);
      }

      return res.status(200).json(ticketsFiltrados);
    }

    // Caso não tenha o filtro de CNPJ, retorne todos os tickets
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
    const ticket = await Ticket.findById(req.params.id).populate("nfse");
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
  const { titulo, observacao, etapa, status, nfse } = req.body;

  try {
    // Verifica se a NFS-e existe, se for fornecida
    if (nfse) {
      const nfseExists = await Nfse.findById(nfse);
      if (!nfseExists) {
        return res.status(404).json({ message: "NFS-e não encontrada" });
      }
    }

    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { titulo, observacao, etapa, status, nfse },
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
