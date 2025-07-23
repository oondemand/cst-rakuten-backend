const express = require("express");
const router = express.Router();
const IntegracaoPrestadorController = require("../controllers/integracaoPrestador");

router.get(
  "/prestador",
  IntegracaoPrestadorController.listarIntegracaoPrestador
);

router.get(
  "/prestador/arquivados",
  IntegracaoPrestadorController.listarIntegracaoPrestadorCentralOmieArquivados
);

router.post(
  "/prestador/processar",
  IntegracaoPrestadorController.processarLista
);

router.post("/prestador/arquivar/:id", IntegracaoPrestadorController.arquivar);
router.post(
  "/prestador/reprocessar/:id",
  IntegracaoPrestadorController.reprocessar
);

module.exports = router;
