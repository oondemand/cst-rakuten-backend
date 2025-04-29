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

const documentoFiscalSchema = new mongoose.Schema(
  {
    prestador: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prestador",
      required: [true, "Prestador é obrigatório"],
    },
    tipoDocumentoFiscal: {
      type: String,
      required: [true, "Tipo Documento Fiscal é obrigatório"],
    },
    numero: {
      type: String,
      required: [true, "Número é obrigatório"],
    },
    competencia: {
      type: CompetenciaType,
    },
    valor: {
      type: Number,
      required: [true, "Valor é obrigatório"],
      min: [0, "Valor não pode ser negativo"],
    },
    imposto: { type: Number, default: 0 },
    classificacaoFiscal: String,
    descricao: { type: String },
    motivoRecusa: { type: String },
    observacaoPrestador: { type: String },
    observacaoInterna: { type: String },
    arquivo: { type: mongoose.Schema.Types.ObjectId, ref: "Arquivo" },
    statusValidacao: {
      type: String,
      enum: ["pendente", "recusado", "aprovado"],
      default: "pendente",
    },
    status: {
      type: String,
      enum: ["aberto", "processando", "pago"],
      default: "aberto",
    },
  },
  {
    timestamps: true,
  }
);

// documentoFiscalSchema.index(
//   { prestador: 1, "competencia.mes": 1, "competencia.ano": 1 },
//   { unique: true }
// );

module.exports = mongoose.model("DocumentoFiscal", documentoFiscalSchema);
