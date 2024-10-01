const express = require("express");
const router = express.Router();
const nfseController = require("../controllers/nfseController");

router.post("/processar-xml",  nfseController.processarXml);
router.get("/sem-ticket",  nfseController.getNfseWithoutTicket);
router.get("/:id",  nfseController.getNfseById);
router.put("/:id",  nfseController.updateNfse);
router.delete("/:id",  nfseController.deleteNfse);
router.post("/",  nfseController.createNfse);
router.get("/",  nfseController.getAllNfse);

module.exports = router;
