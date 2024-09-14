const express = require("express");
const router = express.Router();
const comentarioController = require("../controllers/comentarioController");

// Criar um novo comentário para um ticket
router.post("/:ticketId/comentarios", comentarioController.criarComentario);

// Listar todos os comentários de um ticket
router.get("/:ticketId/comentarios", comentarioController.listarComentariosDoTicket);

// Remover um comentário (opcional)
router.delete("/comentarios/:comentarioId", comentarioController.removerComentario);

module.exports = router;
