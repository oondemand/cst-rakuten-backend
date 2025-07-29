const { default: mongoose } = require("mongoose");

const omieCentral = mongoose.Schema(
  {
    contaPagarId: String,
    ticketId: { type: mongoose.Types.ObjectId, ref: "Ticket" },
    etapa: {
      type: String,
      enum: ["requisicao", "reprocessar", "processando", "falhas", "sucesso"],
    },
    type: {
      type: String,
      enum: ["baixa-cancelada", "baixa-realizada", "alterado", "excluido"],
    },
    requisicao: Object,
    resposta: Object,
    erros: { type: [mongoose.Schema.Types.Mixed] },
    reprocessado: { type: Boolean, default: false },
    tentativas: { type: Number, default: 0 },
    contaPagar: Object,
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

module.exports = mongoose.model("IntegracaoContaPagarOmieCentral", omieCentral);
