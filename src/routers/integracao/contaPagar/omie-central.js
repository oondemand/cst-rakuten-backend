const express = require("express");
const router = express.Router();
const IntegracaoContaPagarOmieCentralController = require("../../../controllers/integracao/contaPagar/omie-central");

router.get("/", IntegracaoContaPagarOmieCentralController.listarComPaginacao);

router.get("/todos", IntegracaoContaPagarOmieCentralController.listarTodas);

router.post("/processar", IntegracaoContaPagarOmieCentralController.processar);

router.post(
  "/arquivar/:id",
  IntegracaoContaPagarOmieCentralController.arquivar
);

router.post(
  "/reprocessar/:id",
  IntegracaoContaPagarOmieCentralController.reprocessar
);

module.exports = router;
