const Comentario = require("../models/Comentario");
const Ticket = require("../models/Ticket");

// Função para criar um novo comentário
const criarComentario = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { texto } = req.body;
    const autorId = req.user.id; // O ID do usuário vem do token JWT

    // Verificar se o ticket existe
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket não encontrado" });
    }

    // Criar o comentário
    const novoComentario = new Comentario({
      texto,
      autor: autorId, // Pega o autor a partir do token JWT
      ticket: ticketId,
    });

    await novoComentario.save();

    res.status(201).json({ message: "Comentário criado com sucesso", novoComentario });
  } catch (error) {
    res.status(500).json({ message: "Erro ao criar comentário", error: error.message });
  }
};

// Função para listar todos os comentários de um ticket
const listarComentariosDoTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Buscar os comentários associados ao ticket
    const comentarios = await Comentario.find({ ticket: ticketId }).populate("autor", "nome email");

    if (comentarios.length === 0) {
      return res.status(404).json({ message: "Nenhum comentário encontrado para este ticket" });
    }

    res.status(200).json(comentarios);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar comentários", error: error.message });
  }
};

// Função para remover um comentário (opcional)
const removerComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;

    // Remover o comentário
    const comentarioRemovido = await Comentario.findByIdAndDelete(comentarioId);
    if (!comentarioRemovido) {
      return res.status(404).json({ message: "Comentário não encontrado" });
    }

    res.status(200).json({ message: "Comentário removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover comentário", error: error.message });
  }
};

module.exports = {
  criarComentario,
  listarComentariosDoTicket,
  removerComentario,
};
