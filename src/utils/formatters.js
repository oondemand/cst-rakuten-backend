const path = require("node:path");

exports.CNPJouCPF = async (numero) => {
  if (isNaN(numero)) {
    return { tipo: null, numero: "" };
  }

  let numeroStr = numero.toString();

  if (numeroStr.length <= 11) {
    return { tipo: "pf", numero: numeroStr.padStart(11, 0) };
  }

  if (numeroStr.length > 11 && numeroStr.length <= 14) {
    return { tipo: "pj", numero: numeroStr.padStart(14, "0") };
  }

  return { tipo: null, numero: "" };
};

exports.criarNomePersonalizado = ({ nomeOriginal }) => {
  try {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}${path.extname(nomeOriginal)}`;

    return filename;
  } catch (error) {
    return "";
  }
};
