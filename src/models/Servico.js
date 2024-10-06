// src/models/Servico.js
const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
  descricao: { type: String, required: true, trim: true, maxlength: 500 },
  valor: { type: Number, required: true, min: 0 },
  data: { type: Date, required: true },
  status: { type: String, enum: ['ativo', 'arquivado'], default: 'ativo' },
}, { timestamps: true });

module.exports = mongoose.model('Servico', servicoSchema);
