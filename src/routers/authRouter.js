const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/login", usuarioController.loginUsuario);
router.post("/seed-usuario", usuarioController.seedUsuario);
router.post("/registrar-usuario", usuarioController.registrarUsuarioPrestador);
router.post("/confirmar-email", usuarioController.confirmarEmail);
router.get("/validar-token", usuarioController.validarToken);

module.exports = router;
