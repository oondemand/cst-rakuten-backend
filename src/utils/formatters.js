const path = require("node:path");

// exports.CNPJouCPF = async (tipoDocumentoFiscal, documento) => {
//   const tipoPessoa = tipoDocumentoFiscal === "RPA" ? "pf" : tipoDocumentoFiscal === "invoice" ? "ext" : "pj";

//   if (tipoPessoa === "pf" && (documento?.length !== 11 || isNaN(documento)))
//     documento = null;

//   if (tipoPessoa === "pj" && (documento?.length !== 14 || isNaN(documento)))
//     documento = null;

//   console.log("[CNPJouCPF]:", tipoPessoa, documento);
//   return { tipoPessoa, documento };
// };

exports.criarNomePersonalizado = ({ nomeOriginal }) => {
  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path.extname(nomeOriginal)}`;

    return filename;
  } catch (error) {
    return "";
  }
};
