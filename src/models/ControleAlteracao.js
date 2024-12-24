const mongoose = require("mongoose");

const controleAlteracaoSchema = new mongoose.Schema({
  dataHora: {
    type: Date,
    default: Date.now,
    required: true,
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
  },
  tipoRegistroAlterado: {
    type: String,
    enum: ["ticket", "usuario"],
    required: true,
  },
  idRegistroAlterado: {
    type: String,
    required: true,
  },
  acao: {
    type: String,
    enum: ["adicionar", "alterar", "excluir", "aprovar", "reprovar", "status"],
    required: true,
  },
  origem: {
    type: String,
    enum: [
      "formulario",
      "importacao-payment-control",
      "integracao-sci",
      "integracao-omie",
    ],
    required: true,
  },
  dadosAtualizados: {
    type: Object,
  },
});

const ControleAlteracao = mongoose.model(
  "ControleAlteracao",
  controleAlteracaoSchema
);
module.exports = ControleAlteracao;
