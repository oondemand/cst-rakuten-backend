// Pessoa.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const EnderecoSchema = require("./Endereco").schema; // Importando o schema, não o modelo

// Sub-schema para Email
const EmailSchema = new Schema({
  tipo: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /\S+@\S+\.\S+/.test(v); // Validação básica de email
      },
      message: (props) => `${props.value} não é um endereço de email válido!`,
    },
  },
});

// Sub-schema para Telefone
const TelefoneSchema = new Schema({
  tipo: {
    type: String,
    required: true,
  },
  ddi: {
    type: Number,
    required: true,
  },
  ddd: {
    type: Number,
    required: true,
  },
  numero: {
    type: Number,
    required: true,
  },
  ramal: {
    type: String,
  },
});

// Schema principal para Pessoa
const PessoaSchema = new Schema({
  tipo: {
    type: String,
    enum: ["pf", "pj"], // 'pf' para pessoa física, 'pj' para pessoa jurídica
    required: true,
  },
  documento: {
    type: String,
    required: true,
    minlength: 11, // CPF (11) ou CNPJ (14)
    maxlength: 14,
  },
  inscricaoMunicipal: {
    type: String,
    maxlength: 8,
  },
  nome: {
    type: String,
    required: true,
    maxlength: 100,
  },
  apelido: {
    type: String,
    maxlength: 50,
  },
  endereco: EnderecoSchema, // Usando o EnderecoSchema aqui
  emails: [EmailSchema], // Lista de subdocumentos para emails
  telefones: [TelefoneSchema], // Lista de subdocumentos para telefones
});

const Pessoa = mongoose.model("Pessoa", PessoaSchema);

module.exports = Pessoa;
