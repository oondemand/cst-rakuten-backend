const express = require("express");
const router = express.Router();
const IntegracaoContaPagarCentralOmieController = require("../../../controllers/integracao/contaPagar/central-omie");

router.get("/", IntegracaoContaPagarCentralOmieController.listarComPaginacao);

router.get("/todos", IntegracaoContaPagarCentralOmieController.listarTodas);

router.post("/processar", IntegracaoContaPagarCentralOmieController.processar);

router.post(
  "/arquivar/:id",
  IntegracaoContaPagarCentralOmieController.arquivar
);

router.post(
  "/reprocessar/:id",
  IntegracaoContaPagarCentralOmieController.reprocessar
);

module.exports = router;
