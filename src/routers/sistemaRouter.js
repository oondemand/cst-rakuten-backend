const express = require("express");
const {
  listarSistemaConfig,
  atualizarSistemaConfig,
  testeEmail,
  listarCategoriasOmie,
  listarContaCorrente,
} = require("../controllers/sistema");
const router = express.Router();

router.get("/", listarSistemaConfig);
router.put("/:id", atualizarSistemaConfig);
router.post("/teste-email", testeEmail);
router.get("/listar-categorias", listarCategoriasOmie);
router.get("/listar-conta-corrente", listarContaCorrente);

module.exports = router;
