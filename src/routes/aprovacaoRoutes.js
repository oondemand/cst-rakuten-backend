const express = require("express");
const router = express.Router();
const aprovacaoController = require("../controllers/aprovacaoController");

router.post("/:ticketId/aprovar", aprovacaoController.aprovar);
router.post("/:ticketId/recusar", aprovacaoController.recusar);

module.exports = router;
