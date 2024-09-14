// backend/models/Empresa.js

const mongoose = require('mongoose');

const EmpresaSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    cnpj: { type: String, required: true, unique: true },
    appKeyOmie: { type: String, required: true },
    appSecretOmie: { type: String, required: true },
    status: { type: String, enum: ['ativo', 'inativo', 'arquivado'], default: 'ativo' },
});

module.exports = mongoose.model('Empresa', EmpresaSchema);
