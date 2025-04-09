const mongoose = require("mongoose");

class CompetenciaType extends mongoose.SchemaType {
  constructor(path, options) {
    super(path, options, "CompetenciaType");
  }

  cast(val) {
    if (val.mes < 1 || val.mes > 12) {
      throw new Error("Mês inválido (1-12).");
    }
    if (val.ano < 2000) {
      throw new Error("Ano mínimo é 2000.");
    }
    return val;
  }
}

mongoose.Schema.Types.CompetenciaType = CompetenciaType;

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

    imposto: { type: Number },
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
    notaFiscal: { type: String },
    dataProvisaoContabil: { type: Date },
    dataRegistro: { type: Date },
    competencia: {
      type: CompetenciaType,
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
  const imposto = this.valores?.imposto || 0;
  return totalServico + totalRevisao + imposto;
});

servicoSchema.index(
  { prestador: 1, "competencia.mes": 1, "competencia.ano": 1 },
  { unique: true }
);

module.exports = mongoose.model("Servico", servicoSchema);
