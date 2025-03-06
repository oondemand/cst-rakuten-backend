const mongoose = require("mongoose");

const valoresSchema = new mongoose.Schema(
  {
    grossValue: Number,
    bonus: Number,
    ajusteComercial: Number,
    paidPlacement: Number,
    revisionMonthProvision: Number,
    revisionGrossValue: Number,
    revisionProvisionBonus: Number,
    revisionComissaoPlataforma: Number,
    revisionPaidPlacement: Number,
    // totalServico: Number,
    // totalRevisao: Number,
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

valoresSchema.virtual("totalServico").get(function () {
  return (
    (this.grossValue || 0) +
    (this.bonus || 0) +
    (this.ajusteComercial || 0) +
    (this.paidPlacement || 0)
  );
});

valoresSchema.virtual("totalRevisao").get(function () {
  return (
    (this.revisionGrossValue || 0) +
    (this.revisionProvisionBonus || 0) +
    (this.revisionComissaoPlataforma || 0) +
    (this.revisionPaidPlacement || 0)
  );
});

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
    // valor: { type: Number, required: true, min: 0, default: 0 },
    tipoDocumentoFiscal: { type: String },
    campanha: { type: String },
    valores: valoresSchema,
    status: {
      type: String,
      enum: ["pendente", "pago-segeti", "pago-rakuten"],
      default: "pendente",
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

servicoSchema.virtual("valor").get(function () {
  const totalServico = this.valores?.totalServico || 0;
  const totalRevisao = this.valores?.totalRevisao || 0;
  return totalServico + totalRevisao;
});

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
