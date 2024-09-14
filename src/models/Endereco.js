const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const EnderecoSchema = new Schema({
  cep: {
    type: String,
    required: true,
  },
  uf: {
    type: String,
    required: true,
    maxlength: 2,
  },
  codigoMunicipio: {
    type: String,
    required: true,
  },
  municipio: {
    type: String,
    required: true,
  },
  endereco: {
    type: String,
    required: true,
  },
  numero: {
    type: String,
    required: true,
  },
  complemento: {
    type: String,
  },
  bairro: {
    type: String,
    required: true,
  },
});

const Endereco = mongoose.model("Endereco", EnderecoSchema);

module.exports = Endereco;
