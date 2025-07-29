const { default: mongoose } = require("mongoose");

const centralOmie = mongoose.Schema(
  {
    contaPagarId: String,
    etapa: {
      type: String,
      enum: [
        "requisicao",
        "reprocessar",
        "processando",
        "falhas",
        "upload_arquivos",
        "sucesso",
      ],
    },
    payload: Object,
    resposta: Object,
    erros: { type: [mongoose.Schema.Types.Mixed] },
    reprocessado: { type: Boolean, default: false },
    tentativas: { type: Number, default: 0 },
    contaPagar: Object,
    prestador: Object,
    executadoEm: Date,
    arquivado: { type: Boolean, default: false },
    ticketId: { type: mongoose.Types.ObjectId, ref: "Ticket" },
    motivoArquivamento: {
      type: String,
      enum: ["duplicidade", "arquivado pelo usuario"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IntegracaoContaPagarCentralOmie", centralOmie);
