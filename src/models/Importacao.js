const mongoose = require("mongoose");

const ArquivoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  buffer: { type: Buffer },
});

const ImportacaoSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ["prestador", "servico", "rpa", "documento-fiscal"],
    },
    arquivoOriginal: ArquivoSchema,
    arquivoErro: { type: Buffer },
    arquivoLog: { type: Buffer },
    detalhes: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Importacao", ImportacaoSchema);
