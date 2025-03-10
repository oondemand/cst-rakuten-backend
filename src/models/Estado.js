const mongoose = require("mongoose");

const estadoSchema = new mongoose.Schema(
  {
    nome: {
      type: String,
      unique: true,
      trim: true,
      required: [true, "O nome do estado é obrigatório"],
    },
    sigla: {
      type: String,
      required: [true, "A sigla é obrigatória"],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [2, "A sigla deve ter exatamente 2 caracteres"],
      maxlength: [2, "A sigla deve ter exatamente 2 caracteres"],
    },
  },
  {
    timestamps: true,
  }
);
const Estado = mongoose.model("Estado", estadoSchema);
module.exports = Estado;
