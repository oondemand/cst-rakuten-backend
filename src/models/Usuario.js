// backend/models/Usuario.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const configuracoesSchema = new mongoose.Schema({ idioma: { type: String } });

const UsuarioSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ["prestador", "central", "admin"],
    default: "prestador",
  },
  nome: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function (v) {
        return /\S+@\S+\.\S+/.test(v);
      },
      message: (props) => `${props.value} não é um e-mail válido!`,
    },
  },
  senha: { type: String, required: true },
  status: {
    type: String,
    enum: ["ativo", "email-nao-confirmado", "inativo", "arquivado"],
    default: "ativo",
  },
  permissoes: { type: [String], default: [] },
  configuracoes: { type: configuracoesSchema },
});

UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("senha")) return next();
  const salt = await bcrypt.genSalt(10);
  this.senha = await bcrypt.hash(this.senha, salt);
  next();
});

UsuarioSchema.methods.gerarToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  }); // Token expira em 24 horas
};

module.exports = mongoose.model("Usuario", UsuarioSchema);
