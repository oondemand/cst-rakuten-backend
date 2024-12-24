const express = require("express");
const router = express.Router();
const controleAlteracao = require("../controllers/controleAlteracao");

router.get("/", controleAlteracao.listarTodosRegistros);

module.exports = router;
