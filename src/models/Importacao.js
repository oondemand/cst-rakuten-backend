const mongoose = require("mongoose");

const ArquivoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  buffer: { type: Buffer },
  path: { type: String },
});

const ImportacaoSchema = new mongoose.Schema(
  {
    tipo: { type: String, enum: ["prestador", "servico"] },
    arquivoOriginal: ArquivoSchema,
    arquivoErro: { type: Buffer },
    arquivoLog: { type: Buffer },
    detalhes: {
      totalDeLinhasLidas: Number,
      linhasLidasComErro: Number,
      novosPrestadores: Number,
      novosServicos: Number,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Importacao", ImportacaoSchema);
