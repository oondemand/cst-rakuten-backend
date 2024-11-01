const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TicketSchema = new mongoose.Schema(
  {
    baseOmie: { type: Schema.Types.ObjectId, ref: "BaseOmie" },
    titulo: { type: String, required: true },
    observacao: { type: String, default: "" },
    etapa: { type: String, required: true },
    data: { type: Date, default: Date.now },
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    servicos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Servico" }],
    contaPagarOmie: { type: String },
    arquivos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Arquivo" }],
    status: {
      type: String,
      enum: ["aguardando-inicio", "trabalhando", "revisao", "arquivado", "concluido"],
      default: "aguardando-inicio",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Ticket", TicketSchema);
