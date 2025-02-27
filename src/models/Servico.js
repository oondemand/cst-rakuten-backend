const mongoose = require("mongoose");

const servicoSchema = new mongoose.Schema(
  {
    prestador: { type: mongoose.Schema.Types.ObjectId, ref: "Prestador" },
    dataProvisaoContabil: { type: Date },
    dataRegistro: { type: Date },
    competencia: {
      type: {
        mes: { type: Number, required: true, min: 1, max: 12 },
        ano: { type: Number, required: true, min: 2000 },
      },
    },
    valor: { type: Number, required: true, min: 0, default: 0 },
    tipoDocumentoFiscal: { type: String },
    campanha: { type: String },
    valores: {
      grossValue: Number,
      bonus: Number,
      ajusteComercial: Number,
      paidPlacement: Number,
      revisionMonthProvision: Number,
      revisionGrossValue: Number,
      revisionProvisionBonus: Number,
      revisionComissãoPlataforma: Number,
      revisionPaidPlacement: Number,
      totalServico: Number,
      totalRevisao: Number,
    },
    status: {
      type: String,
      enum: ["pendente", "pago-segeti", "pago-rakuten"],
      default: "pendente",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

servicoSchema.index(
  { prestador: 1, "competencia.mes": 1, "competencia.ano": 1 },
  { unique: true }
);

// servicoSchema.virtual("competencia").get(function () {
//   if (this.mesCompetencia != null && this.anoCompetencia != null) {
//     const mes = this.mesCompetencia.toString().padStart(2, "0");
//     const ano = this.anoCompetencia.toString();

//     return `${mes}/${ano}`;
//   }

//   return "";
// });

module.exports = mongoose.model("Servico", servicoSchema);
