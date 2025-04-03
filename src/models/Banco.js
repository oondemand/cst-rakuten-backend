const mongoose = require("mongoose");

const BancoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    codigo: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banco", BancoSchema);
