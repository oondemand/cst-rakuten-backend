const mongoose = require("mongoose");

const integracaoPrestadorSchema = new mongoose.Schema(
  {
    prestadorId: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    etapa: {
      type: String,
      enum: ["requisicao", "reprocessar", "processando", "falhas", "sucesso"],
    },
    payload: Object,
    resposta: Object,
    erros: { type: [mongoose.Schema.Types.Mixed] },
    reprocessado: { type: Boolean, default: false },
    tentativas: { type: Number, default: 0 },
    prestador: Object,
    executadoEm: Date,
    arquivado: { type: Boolean, default: false },
    motivoArquivamento: {
      type: String,
      enum: ["duplicidade", "arquivado pelo usuario"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "IntegracaoPrestador",
  integracaoPrestadorSchema
);
