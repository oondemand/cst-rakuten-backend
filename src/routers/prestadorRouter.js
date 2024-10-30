// src/routers/prestadorRouter.js
const express = require("express");
const prestadorController = require("../controllers/prestadorController");
const router = express.Router();

// Rotas para CRUD de Prestador
router.post(
  "/adicionar-e-criar-ticket",
  prestadorController.adicionarPrestadorECriarTicket,
);
router.post("/", prestadorController.criarPrestador);

router.get(
  "/usuario/:idUsuario",
  prestadorController.obterPrestadorPorIdUsuario,
);
router.get("/sid/:sid", prestadorController.obterPrestadorPorSid);
router.get("/", prestadorController.listarPrestadores);
router.get("/:id", prestadorController.obterPrestador);

router.patch("/:id", prestadorController.atualizarPrestador);

router.delete("/:id", prestadorController.excluirPrestador);

module.exports = router;
