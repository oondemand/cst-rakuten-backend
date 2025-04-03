const mongoose = require("mongoose");

const sciSchema = new mongoose.Schema(
  {
    codigo_empresa: { type: String },
    codigo_centro_custo: { type: String },
    porcentagem_iss: { type: Number },
    dias_pagamento: { type: Number },
    cbo: { type: String },
    cfip: { type: String },
    e_social: { type: String },
  },
  { _id: false }
);

const omieSchema = new mongoose.Schema(
  {
    id_conta_corrente: { type: String },
    codigo_categoria: { type: String },
  },
  { _id: false }
);

const sistemaSchema = new mongoose.Schema(
  {
    sci: sciSchema,
    omie: omieSchema,
    remetente: { type: { nome: String, email: String } },
    data_corte_app_publisher: { type: Date },
  },
  { timestamps: true }
);

const Sistema = mongoose.model("Sistema", sistemaSchema);

module.exports = Sistema;
