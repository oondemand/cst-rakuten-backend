// src/routers/prestadorRouter.js
const express = require('express');
const prestadorController = require('../controllers/prestadorController');
const router = express.Router();

// Rotas para CRUD de Prestador
router.post('/', prestadorController.criarPrestador);
router.get('/', prestadorController.listarPrestadores);
router.get('/:id', prestadorController.obterPrestador);
router.put('/:id', prestadorController.atualizarPrestador);
router.delete('/:id', prestadorController.excluirPrestador);

module.exports = router;
