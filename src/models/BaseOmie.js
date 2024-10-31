// backend/models/BaseOmie.js

const mongoose = require("mongoose");

const BaseOmieSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cnpj: { type: String, required: true, unique: true },
  appKey: { type: String, required: true },
  appSecret: { type: String, required: true },
  status: {
    type: String,
    enum: ["ativo", "inativo", "arquivado"],
    default: "ativo",
  },
});

module.exports = mongoose.model("BaseOmie", BaseOmieSchema);
