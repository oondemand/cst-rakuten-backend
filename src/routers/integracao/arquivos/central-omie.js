const express = require("express");
const router = express.Router();
const IntegracaoArquivosCentralOmieController = require("../../../controllers/integracao/arquivos/central-omie");

router.get("/", IntegracaoArquivosCentralOmieController.listarComPaginacao);

router.get("/todos", IntegracaoArquivosCentralOmieController.listarTodas);

router.post("/processar", IntegracaoArquivosCentralOmieController.processar);

router.post("/arquivar/:id", IntegracaoArquivosCentralOmieController.arquivar);

router.post(
  "/reprocessar/:id",
  IntegracaoArquivosCentralOmieController.reprocessar
);

module.exports = router;
