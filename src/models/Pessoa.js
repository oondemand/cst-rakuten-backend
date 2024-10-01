// Pessoa.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema principal para Pessoa
const PessoaSchema = new Schema({
  documento: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{11}$|^\d{14}$/.test(v); // Verifica se contém exatamente 11 ou 14 dígitos
      },
      message: (props) =>
        `${props.value} não é um documento válido! Deve conter exatamente 11 ou 14 dígitos.`,
    },
  },
  tipo: {
    type: String,
    enum: ["pf", "pj"], // 'pf' para pessoa física, 'pj' para pessoa jurídica
    required: true,
  },
  nome: {
    type: String,
    required: true,
    maxlength: 100,
  },
});

// Middleware para definir o tipo com base no comprimento do documento
PessoaSchema.pre("save", function (next) {
  if (this.documento.length === 11) {
    this.tipo = "pf";
  } else if (this.documento.length === 14) {
    this.tipo = "pj";
  }
  next();
});

const Pessoa = mongoose.model("Pessoa", PessoaSchema);

module.exports = Pessoa;