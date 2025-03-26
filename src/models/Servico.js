const mongoose = require("mongoose");

const valoresSchema = new mongoose.Schema(
  {
    grossValue: { type: Number },
    bonus: { type: Number },
    ajusteComercial: { type: Number },
    paidPlacement: { type: Number },
    revisionMonthProvision: { type: Date },
    revisionGrossValue: { type: Number },
    revisionProvisionBonus: { type: Number },
    revisionComissaoPlataforma: { type: Number },
    revisionPaidPlacement: { type: Number },
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
    tipoDocumentoFiscal: { type: String },
    campanha: { type: String },
    valores: valoresSchema,
    status: {
      type: String,
      enum: ["aberto", "pendente", "processando", "pago", "pago-externo"],
      default: "aberto",
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

module.exports = mongoose.model("Servico", servicoSchema);
