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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
