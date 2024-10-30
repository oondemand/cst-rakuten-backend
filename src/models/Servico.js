// src/models/Servico.js
const mongoose = require("mongoose");

const servicoSchema = new mongoose.Schema(
  {
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    mesCompetencia: { type: Number, required: true, min: 1, max: 12 },
    anoCompetencia: { type: Number, required: true, min: 2000 },
    valorPrincipal: { type: Number, required: true, min: 0, default: 0 },
    valorBonus: { type: Number },
    valorAjusteComercial: { type: Number },
    valorHospedagemAnuncio: { type: Number },
    valorTotal: { type: Number, required: true, min: 0, default: 0 },
    correcao: { type: Boolean, required: true, default: false },
    status: {
      type: String,
      enum: ["ativo", "em-analise", "pendente-de-revisao", "arquivado"],
      default: "ativo",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Servico", servicoSchema);
