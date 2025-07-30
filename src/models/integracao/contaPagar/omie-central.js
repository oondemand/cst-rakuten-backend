const { default: mongoose } = require("mongoose");

const omieCentral = mongoose.Schema(
  {
    ticket: { type: mongoose.Types.ObjectId, ref: "Ticket" },
    codigo_lancamento_integracao: String,
    codigo_lancamento_omie: String,
    etapa: {
      type: String,
      enum: ["requisicao", "reprocessar", "processando", "falhas", "sucesso"],
    },
    tipo: {
      type: String,
      required: true,
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
