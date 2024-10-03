const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/login", usuarioController.loginUsuario);
router.post("/seed-usuario", usuarioController.seedUsuario);
router.get("/validar-token", usuarioController.validarToken); // Rota para validar o token

module.exports = router;
