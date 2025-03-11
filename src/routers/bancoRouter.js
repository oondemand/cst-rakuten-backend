const express = require("express");
const router = express.Router();
const { listarBancos } = require("../controllers/bancoController"); // Ajuste o caminho conforme necessário

router.get("/", listarBancos);

module.exports = router;
