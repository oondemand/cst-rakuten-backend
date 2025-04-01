const express = require("express");
const {
  listarSistemaConfig,
  atualizarSistemaConfig,
  testeEmail,
} = require("../controllers/sistema");
const router = express.Router();

router.get("/", listarSistemaConfig);
router.put("/:id", atualizarSistemaConfig);
router.post("/teste-email", testeEmail);

module.exports = router;
