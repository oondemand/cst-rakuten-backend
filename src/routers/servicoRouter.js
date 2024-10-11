// src/routers/servicoRouter.js
const express = require('express');
const servicoController = require('../controllers/servicoController');
const router = express.Router();

// Rota para criar um novo serviço e ticket
router.get('/:id', servicoController.getServicoById);
router.post('/', servicoController.createServico);
router.post('/adicionar-e-criar-ticket', servicoController.createServicoETicket);
router.patch('/:id', servicoController.updateServico);

module.exports = router;