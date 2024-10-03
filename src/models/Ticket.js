// models/Ticket.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketSchema = new mongoose.Schema(
  {
    baseOmie: {
      type: Schema.Types.ObjectId,
      ref: "BaseOmie",
      required: true,
    },
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
    contaPagarOmie: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
