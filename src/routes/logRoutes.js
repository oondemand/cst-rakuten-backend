const express = require("express");
const router = express.Router();
const { listarTodosLogs, listarLogsPorUsuario, filtrarLogs } = require("../controllers/logController");
const authMiddleware = require("../middlewares/authMiddleware");

// Rota para listar todos os logs (protegida por autenticação)
router.get("/", authMiddleware, listarTodosLogs);

// Rota para listar logs por usuário (protegida por autenticação)
router.get("/usuario/:usuarioId", authMiddleware, listarLogsPorUsuario);

// Rota para filtrar logs por endpoint ou método HTTP (protegida por autenticação)
router.get("/filtrar", authMiddleware, filtrarLogs);

module.exports = router;
