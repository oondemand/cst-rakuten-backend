const express = require("express");
const router = express.Router();
const integracaoRpaController = require("../controllers/integracaoRpaController");

router.get("/exportar-prestadores", integracaoRpaController.exportarPrestadores);

module.exports = router;
