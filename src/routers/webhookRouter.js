const express = require("express");

const ContaPagarController = require("../controllers/contaPagarController");

const router = express.Router();

router.post("/conta-pagar", ContaPagarController.contaPagarWebHook);

module.exports = router;
