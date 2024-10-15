const express = require("express");
const router = express.Router();
const acaoEtapaController = require("../controllers/acaoEtapaController");

router.post("/importar-comissoes", acaoEtapaController.importarComissoes);
router.post("/exportar-servicos", acaoEtapaController.exportarServicos);
router.post("/exportar-prestadores", acaoEtapaController.exportarPrestadores);
router.post("/importar-prestadores", acaoEtapaController.importarPrestadores);
router.post("/importar-rpas", acaoEtapaController.importarRPAs);

module.exports = router;
