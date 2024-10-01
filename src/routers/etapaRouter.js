const express = require("express");
const router = express.Router();
const etapaController = require("../controllers/etapaController");

router.post("/",  etapaController.criarEtapa);
router.get("/ativas",  etapaController.listarEtapasAtivas);
router.get("/",  etapaController.listarEtapas);
router.get("/:id",  etapaController.obterEtapa);
router.put("/:id",  etapaController.atualizarEtapa);
router.delete("/:id",  etapaController.excluirEtapa);

module.exports = router;
