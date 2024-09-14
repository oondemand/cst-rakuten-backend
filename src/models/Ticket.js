// models/Ticket.js
const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
    },
    observacao: {
      type: String,
      default: "",
    },
    etapa: {
      type: String,
      required: true,
    },
    status: {
      type: String,
    },
    nfse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nfse",
      required: true,
    },
    contaPagarOmie: {
      type: String,
    },
    // arquivos: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Arquivo", // Referência ao modelo de Arquivo
    //   },
    // ], // Lista de arquivos associados ao ticket
    // comentarios: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Comentario", // Referência a um modelo de Comentário (opcional)
    //   },
    // ], // Lista de comentários associados ao ticket
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
