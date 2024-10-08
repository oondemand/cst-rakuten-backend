// backend/routes/empresaRoutes.js

const express = require("express");
const baseOmieController = require("../controllers/baseOmieController");
const router = express.Router();

router.post("/",  baseOmieController.registrarBaseOmie);
router.get("/",  baseOmieController.listarBaseOmies);
router.get("/:id",  baseOmieController.obterBaseOmie);
router.patch("/:id",  baseOmieController.atualizarBaseOmie);
router.delete("/:id",  baseOmieController.excluirBaseOmie);

module.exports = router;
