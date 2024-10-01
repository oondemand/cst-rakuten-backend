// backend/routes/empresaRoutes.js

const express = require("express");
const baseOmieController = require("../controllers/baseOmieController");
const router = express.Router();

router.post("/",  baseOmieController.registrarEmpresa);
router.get("/",  baseOmieController.listarEmpresas);
router.get("/:id",  baseOmieController.obterEmpresa);
router.put("/:id",  baseOmieController.atualizarEmpresa);
router.delete("/:id",  baseOmieController.excluirEmpresa);

module.exports = router;
