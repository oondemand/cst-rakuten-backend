const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Pessoa = require("./Pessoa"); // Assumindo que a model Pessoa já foi criada e exportada

// Sub-schema para Valores do Serviço
const ValoresSchema = new Schema({
  aliquota: {
    type: Number,
    required: true,
  },
  valorIss: {
    type: Number,
    required: true,
  },
  valorServicos: {
    type: Number,
    required: true,
  },
});

// Sub-schema para Serviço
const ServicoSchema = new Schema({
  valores: ValoresSchema, // Subdocumento para armazenar os valores do serviço
  issRetido: {
    type: Number,
    required: true,
  },
  discriminacao: {
    type: String,
    required: true,
    maxlength: 500,
  },
});

// Sub-schema para Declaração de Prestação de Serviço
const DeclaracaoPrestacaoServicoSchema = new Schema({
  competencia: {
    type: String, // MM/YYYY
    required: true,
  },
  servico: ServicoSchema, // Subdocumento para armazenar os detalhes do serviço
  optanteSimplesNacional: {
    type: Number, // 0 ou 1
    required: true,
  },
});

// Sub-schema para InfoNfse
const InfoNfseSchema = new Schema({
  numero: {
    type: Number,
    required: true,
  },
  dataEmissao: { 
    type: Date,
    required: true,
  },
  prestador: {
    type: Pessoa.schema, // Referência ao schema da model Pessoa
    required: true,
  },
  tomador: {
    type: Pessoa.schema, // Referência ao schema da model Pessoa
    required: true,
  },
  declaracaoPrestacaoServico: DeclaracaoPrestacaoServicoSchema, // Subdocumento para declaração de prestação de serviço
});

// Schema principal para Nfse
const NfseSchema = new Schema({
  origem: {
    type: String,
    enum: ["xml", "manual"],
  },
  tipoXml: {
    type: String,
    enum: ["abrasf-resumido", "outro", ""],
  },
  tipoXmlOutro: {
    type: String,
    maxlength: 100,
  },
  xmlOriginal: {
    type: String, // Base64 encoded file
  },
  infoNfse: InfoNfseSchema, // Subdocumento para as informações da NFSe
});

const Nfse = mongoose.model("Nfse", NfseSchema);

module.exports = Nfse;
