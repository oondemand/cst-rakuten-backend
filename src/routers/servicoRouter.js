// src/routers/servicoRouter.js
const express = require('express');
const servicoController = require('../controllers/servicoController');
const router = express.Router();

// Rota para criar um novo serviço e ticket
router.post('/', servicoController.createServico);

module.exports = router;