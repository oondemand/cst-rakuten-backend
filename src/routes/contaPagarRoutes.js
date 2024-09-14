const express = require('express');
const router = express.Router();
const contaPagarController = require('../controllers/contaPagarController');

router.get('/:codigoLancamento',  contaPagarController.obterContaPagarOmie);

module.exports = router;
