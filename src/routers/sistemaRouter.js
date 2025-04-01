const express = require("express");
const {
  listarSistemaConfig,
  atualizarSistemaConfig,
} = require("../controllers/sistema");
const router = express.Router();

router.get("/", listarSistemaConfig);
router.put("/:id", atualizarSistemaConfig);

module.exports = router;
