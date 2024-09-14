// backend/routes/empresaRoutes.js

const express = require("express");
const empresaController = require("../controllers/empresaController");
const router = express.Router();

router.post("/",  empresaController.registrarEmpresa);
router.get("/",  empresaController.listarEmpresas);
router.get("/:id",  empresaController.obterEmpresa);
router.put("/:id",  empresaController.atualizarEmpresa);
router.delete("/:id",  empresaController.excluirEmpresa);

module.exports = router;
