// src/routers/servicoRouter.js
const express = require('express');
const servicoController = require('../controllers/servicoController');
const router = express.Router();

// Rota para criar um novo serviço e ticket
router.post('/criar-ticket', servicoController.createServicoETicket);
router.post('/', servicoController.createServico);

module.exports = router;