const express = require("express");
const router = express.Router();
const IntegracaoPrestadorOmieCentralController = require("../../../controllers/integracao/prestador/omie-central");

router.get("/", IntegracaoPrestadorOmieCentralController.listarComPaginacao);

router.get("/todos", IntegracaoPrestadorOmieCentralController.listarTodas);

router.post("/processar", IntegracaoPrestadorOmieCentralController.processar);

router.post("/arquivar/:id", IntegracaoPrestadorOmieCentralController.arquivar);

router.post(
  "/reprocessar/:id",
  IntegracaoPrestadorOmieCentralController.reprocessar
);

module.exports = router;
