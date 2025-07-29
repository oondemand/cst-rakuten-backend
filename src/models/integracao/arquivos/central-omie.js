const mongoose = require("mongoose");

const centralOmie = mongoose.Schema(
  {
    contaPagarId: String,
    integracaoContaPagarId: {
      type: mongoose.Types.ObjectId,
      ref: "IntegracaoContaPagarCentralOmie",
    },
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
    requisicao: Object,
    resposta: Object,
    erros: { type: [mongoose.Schema.Types.Mixed] },
    reprocessado: { type: Boolean, default: false },
    tentativas: { type: Number, default: 0 },
    arquivo: Object,
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

module.exports = mongoose.model("IntegracaoArquivosCentralOmie", centralOmie);
