const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.post("/login", usuarioController.loginUsuario);
router.post("/seed-usuario", usuarioController.seedUsuario);
router.post("/registrar-usuario", usuarioController.registrarUsuarioPrestador);
router.post("/confirmar-email", usuarioController.confirmarEmail);
router.get("/validar-token", usuarioController.validarToken);

router.post("/esqueci-minha-senha", usuarioController.esqueciMinhaSenha);
router.post("/alterar-senha", usuarioController.alterarSenha);

module.exports = router;
