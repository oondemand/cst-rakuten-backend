const mongoose = require("mongoose");

const ArquivoSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true },
    nomeOriginal: { type: String, required: true },
    tipo: {
      type: String,
      enum: ["generico", "rpa", "documento-fiscal"],
      default: "generico",
    },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    buffer: { type: Buffer },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Arquivo", ArquivoSchema);
