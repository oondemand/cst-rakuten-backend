const express = require("express");
const router = express.Router();
const {
  listarTodosLogs,
  listarLogsPorUsuario,
  filtrarLogs,
  excluirTodosLogs
} = require("../controllers/logController");

// Rota para listar todos os logs (protegida por autenticação)
router.get("/", listarTodosLogs);

// Rota para listar logs por usuário (protegida por autenticação)
router.get("/usuario/:usuarioId", listarLogsPorUsuario);

// Rota para filtrar logs por endpoint ou método HTTP (protegida por autenticação)
router.get("/filtrar", filtrarLogs);

router.post("/excluir-todos, excluirTodosLogs");

module.exports = router;
