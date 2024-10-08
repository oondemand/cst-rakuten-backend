// src/models/Servico.js
const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
  descricao: { type: String, required: true, trim: true, maxlength: 500 },
  valor: { type: Number, required: true, min: 0 },
  data: { type: Date, required: true },
  comentariosRevisao: String,
  status: {
    type: String,
    enum: ["ativo", "em-analise", "pendente-de-revisao", "arquivado"],
    default: "ativo",
  },
}, { timestamps: true });

module.exports = mongoose.model('Servico', servicoSchema);
