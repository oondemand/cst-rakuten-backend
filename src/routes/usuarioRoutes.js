const express = require("express");
const usuarioController = require("../controllers/usuarioController");
const router = express.Router();

router.get("/", usuarioController.listarUsuarios);
router.post("/", usuarioController.registrarUsuario);
router.get("/:id", usuarioController.obterUsuario);
router.put("/:id", usuarioController.atualizarUsuario);
router.delete("/:id", usuarioController.excluirUsuario);

module.exports = router;
