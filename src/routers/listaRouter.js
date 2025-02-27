const express = require("express");
const router = express.Router();
const listaController = require("../controllers/listaController");

router.post("/", listaController.createLista);
router.get("/", listaController.getListas);
router.post("/:id/", listaController.addItem);
router.delete("/:id/:itemId", listaController.removeItem);
router.put("/:id", listaController.updateItem);

module.exports = router;
