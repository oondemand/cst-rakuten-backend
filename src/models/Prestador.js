// src/models/Prestador.js
const mongoose = require("mongoose");

// Esquema de Endereço
const enderecoSchema = new mongoose.Schema({
  cep: { type: String, match: /^\d{8}$/ },
  rua: String,
  numero: String,
  complemento: String,
  cidade: String,
  estado: String,
});

// Esquema de Dados Bancários
const dadosBancariosSchema = new mongoose.Schema({
  banco: String,
  agencia: String,
  conta: String,
  tipoConta: { type: String, enum: ["", "corrente", "poupanca"] },
});

// Esquema Principal do Prestador
const prestadorSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    nome: { type: String, required: true },
    sid: { type: String, required: true, unique: true },
    tipo: { type: String, enum: ["pj", "pf"], required: true },
    documento: { type: String, match: /^\d{11}$|^\d{14}$/, required: true },
    dadosBancarios: dadosBancariosSchema,
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      validate: {
        validator: function (v) {
          return /\S+@\S+\.\S+/.test(v);
        },
        message: (props) => `${props.value} não é um e-mail válido!`,
      },
    },
    endereco: enderecoSchema,
    pessoaFisica: {
      dataNascimento: Date,
      pis: String,
      nomeMae: String,
      rg: {
        numero: String,
        orgaoEmissor: String,
      },
    },
    comentariosRevisao: String,
    status: {
      type: String,
      enum: ["ativo", "em-analise", "pendente-de-revisao", "inativo", "arquivado"],
      default: "ativo",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prestador", prestadorSchema);
