// src/models/Prestador.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Esquema de Endereço
const enderecoSchema = new mongoose.Schema({
  cep: { type: String, match: /^\d{8}$/ },
  rua: String,
  numero: String,
  complemento: String,
  cidade: String,
  estado: String,
  pais: {
    type: { nome: String, cod: Number },
    default: { nome: "Brasil", cod: 1058 },
  },
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
    sciUnico: { type: Number, match: /^\d{6,}$/ },
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario" },
    codigo_cliente_omie: { type: String },
    manager: { type: String },
    nome: { type: String, required: true },
    sid: {
      type: [Number],
      required: true,
      unique: true,
      validate: [
        {
          validator: function (arr) {
            return arr.every((n) => /^\d{7}$/.test(n.toString()));
          },
          message: "Cada SID deve ter exatamente 7 dígitos.",
        },
        {
          validator: function (arr) {
            const set = new Set(arr);
            return set.size === arr.length; // evita sids repetidos no mesmo prestador
          },
          message: "Não pode haver SIDs duplicados.",
        },
      ],
    },
    tipo: { type: String, enum: ["pj", "pf", "ext", ""] },
    documento: {
      type: String,
      unique: true,
      // validate: {
      //   validator: function (valor) {
      //     if (this.tipo === "ext") {
      //       return true;
      //     }

      //     return /^\d{11}$|^\d{14}$/.test(valor);
      //   },
      //   message: "Documento inválido para o tipo selecionado.",
      // },
    },
    dadosBancarios: dadosBancariosSchema,
    email: {
      type: String,
      lowercase: true,
      validate: {
        validator: function (v) {
          return v === null ? true : /\S+@\S+\.\S+/.test(v);
        },
        message: (props) => `${props.value} não é um e-mail válido!`,
      },
      required: false,
    },
    endereco: enderecoSchema,
    pessoaFisica: {
      dataNascimento: Date,
      pis: String,
      rg: {
        numero: String,
        orgaoEmissor: String,
      },
    },
    pessoaJuridica: {
      razaoSocial: String,
      nomeFantasia: String,
      codigoCNAE: String,
      codigoServicoNacional: String,
      regimeTributario: {
        type: String,
        enum: ["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"],
      },
    },
    comentariosRevisao: String,
    status: {
      type: String,
      enum: ["ativo", "pendente-de-revisao", "inativo", "arquivado"],
      default: "ativo",
    },
    dataExportacao: { type: Date, default: null },
  },
  { timestamps: true }
);

prestadorSchema.methods.gerarToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  }); // Token expira em 24 horas
};

module.exports = mongoose.model("Prestador", prestadorSchema);
