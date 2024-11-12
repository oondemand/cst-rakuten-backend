exports.CNPJouCPF = (numero) => {
  if (isNaN(numero)) {
    return { tipo: "", numero: "" };
  }

  let numeroStr = numero.toString();

  if (numeroStr.length === 11) {
    return { tipo: "pf", numero: numeroStr };
  }

  if (numeroStr.padStart(14, "0").length <= 14) {
    return { tipo: "pj", numero: numeroStr.padStart(14, "0") };
  }

  return { tipo: "pj", numero: numeroStr };
};
