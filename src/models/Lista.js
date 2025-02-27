const mongoose = require("mongoose");

const ListaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  valores: [
    {
      chave: { type: String },
      valor: { type: String },
    },
  ],
});

module.exports = mongoose.model("Lista", ListaSchema);
