const express = require("express");

const ContaPagarController = require("../controllers/contaPagarController");
const PrestadorController = require("../controllers/prestadorController");

const router = express.Router();

router.post("/conta-pagar", ContaPagarController.contaPagarWebHook);
router.post("/prestador", PrestadorController.prestadorWebHook);

module.exports = router;
