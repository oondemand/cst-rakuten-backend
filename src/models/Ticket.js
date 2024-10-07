// models/Ticket.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Servico = require("./Servico"); // Importar o modelo Servico

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
    data: {
      type: Date,
      default: Date.now,
    },
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    servico: { type: mongoose.Schema.Types.ObjectId, ref: "Servico" },
    contaPagarOmie: {
      type: String,
    },
    status: {
      type: String,
      enum: ["aguardando-inicio", "trabalhando", "revisao", "arquivado"],
      default: "ativo",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", TicketSchema);
