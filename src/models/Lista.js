const mongoose = require("mongoose");

const ListaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  valores: {
    type: [
      {
        valor: { type: String },
      },
    ],
    validate: {
      validator: function (array) {
        return array.length <= 500; // Limite de 500 elementos
      },
      message: "A lista de valores excedeu o limite de 500 elementos.",
    },
  },
});

module.exports = mongoose.model("Lista", ListaSchema);
