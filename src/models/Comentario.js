const mongoose = require("mongoose");

const comentarioSchema = new mongoose.Schema(
  {
    texto: {
      type: String,
      required: true,
      trim: true,
    },
    autor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario", // Referência ao usuário que fez o comentário
      required: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket", // Referência ao ticket associado ao comentário
      required: true,
    },
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt automaticamente
  }
);

const Comentario = mongoose.model("Comentario", comentarioSchema);

module.exports = Comentario;
