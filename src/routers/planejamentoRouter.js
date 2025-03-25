const express = require("express");
const {
  sincronizarEsteira,
} = require("../controllers/planejamento/sincronizarEsteira");
const {
  listarServicos,
} = require("../controllers/planejamento/listarServicos");

const router = express.Router();

router.get("/listar-servicos", listarServicos);
router.post("/sincronizar-esteira", sincronizarEsteira);

module.exports = router;
