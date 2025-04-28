const express = require("express");
const documentoFiscalController = require("../controllers/documentoFiscal/index");
const router = express.Router();

router.get("/", documentoFiscalController.listarDocumentoFiscal);

router.get(
  "/prestador/:prestadorId",
  documentoFiscalController.listarDocumentoFiscalPorPrestador
);

// router.get("/:id", documentoFiscalController.getServicoById);
router.delete("/:id", documentoFiscalController.excluirDocumentoFiscal);

router.post("/", documentoFiscalController.createDocumentoFiscal);

// router.post(
//   "/adicionar-e-criar-ticket",
//   documentoFiscalController.createServicoETicket
// );

router.patch("/:id", documentoFiscalController.updateDocumentoFiscal);
// router.patch("/", documentoFiscalController.atualizarStatus);

module.exports = router;
