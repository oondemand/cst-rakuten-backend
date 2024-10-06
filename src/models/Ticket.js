// models/Ticket.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketSchema = new mongoose.Schema(
  {
    baseOmie: {
      type: Schema.Types.ObjectId,
      ref: "BaseOmie",
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
    prestador: {
      type: Schema.Types.ObjectId,
      ref: "Prestador",
    },
    servico: {
      type: Schema.Types.ObjectId,
      ref: "Servico",
    },
    contaPagarOmie: {
      type: String,
    },
    status: {
      type: String,
      enum: ["ativo", "arquivado"],
      default: "ativo",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
