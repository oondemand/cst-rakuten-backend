// src/routers/servicoRouter.js
const express = require("express");
const servicoController = require("../controllers/servicoController");
const router = express.Router();

router.get("/", servicoController.listarServicos);

// Rota para criar um novo serviço e ticket
router.get("/:id", servicoController.getServicoById);
router.delete("/:id", servicoController.excluirServico);

router.post("/", servicoController.createServico);
router.post(
  "/adicionar-e-criar-ticket",
  servicoController.createServicoETicket
);
router.patch("/:id", servicoController.updateServico);

module.exports = router;
