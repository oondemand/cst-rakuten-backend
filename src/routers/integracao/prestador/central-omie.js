const express = require("express");
const router = express.Router();
const IntegracaoPrestadorCentralOmieController = require("../../../controllers/integracao/prestador/central-omie");

router.get("/", IntegracaoPrestadorCentralOmieController.listarComPaginacao);

router.get("/todos", IntegracaoPrestadorCentralOmieController.listarTodas);

router.post("/processar", IntegracaoPrestadorCentralOmieController.processar);

router.post("/arquivar/:id", IntegracaoPrestadorCentralOmieController.arquivar);

router.post(
  "/reprocessar/:id",
  IntegracaoPrestadorCentralOmieController.reprocessar
);

module.exports = router;
