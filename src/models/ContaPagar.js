const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ContaPagarSchema = new mongoose.Schema({
  baseOmie: { type: Schema.Types.ObjectId, ref: "BaseOmie" },
  data_previsao: { type: String },
  data_entrada: { type: String },
  codigo_lancamento_omie: { type: Number },
  codigo_lancamento_integracao: { type: String },
  codigo_cliente_fornecedor: { type: String },
  data_vencimento: { type: String },
  valor_documento: { type: Number },
  numero_documento_fiscal: { type: String },
  data_emissao: { type: String },
  numero_documento: { type: String },
  numero_parcela: { type: String },
  status_titulo: { type: String },
  valor_pag: { type: Number },
  codigo_categoria: { type: String },
  observacao: { type: String },
});

module.exports = mongoose.model("ContaPagar", ContaPagarSchema);
