// src/routers/servicoRouter.js
const express = require('express');
const servicoController = require('../controllers/servicoController');
const router = express.Router();

// Rota para criar um novo serviço e ticket
router.get('/:id', servicoController.getServicoById);
router.post('/criar-ticket', servicoController.createServicoETicket);
router.post('/', servicoController.createServico);
router.patch('/:id', servicoController.updateServico);

module.exports = router;