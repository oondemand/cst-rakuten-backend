const express = require("express");
const router = express.Router();
const IntegracaoPrestadorController = require("../controllers/integracaoPrestador");

router.get(
  "/prestador",
  IntegracaoPrestadorController.listarIntegracaoPrestador
);

router.post(
  "/prestador/processar",
  IntegracaoPrestadorController.processarLista
);

router.post("/prestador/arquivar/:id", IntegracaoPrestadorController.arquivar);

module.exports = router;
