const express = require("express");
const router = express.Router();
const listaController = require("../controllers/listaController");

router.post("/", listaController.createLista);
router.get("/", listaController.getListas);
router.get("/:codigo", listaController.getListaPorCodigo);
router.post("/:id/", listaController.addItem);
router.delete("/:id/:itemId", listaController.removeItem);
router.delete("/:id", listaController.deletarLista);
router.put("/:id", listaController.updateItem);

module.exports = router;
