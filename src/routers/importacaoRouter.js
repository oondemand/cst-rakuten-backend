const express = require("express");
const { listarImportacoes } = require("../controllers/importacao/list");

const router = express.Router();
router.get("/", listarImportacoes);

module.exports = router;
