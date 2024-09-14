const mongoose = require("mongoose");

const ArquivoSchema = new mongoose.Schema(
  {
    nomeOriginal: {
      type: String,
      required: true,
    },
    nomeArmazenado: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    caminho: {
      type: String,
      required: true,
    },
    tamanho: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true, // Cria automaticamente os campos createdAt e updatedAt
  }
);

const Arquivo = mongoose.model("Arquivo", ArquivoSchema);

module.exports = Arquivo;
