const { format, addDays } = require("date-fns");
const { ptBR } = require("date-fns/locale");

const formatarDataOmie = (data) => {
  try {
    return format(data, "dd/MM/yyyy", { locale: ptBR });
  } catch (error) {
    console.log("Error", error);
  }
};

// export const formatarDataOmie = (date) => {
//   if (!date) return "";
//   const [year, month, day] = date.split("T")[0].split("-");

//   return `${day}/${month}/${year}`;
// };

const converterNumeroSerieParaData = (numeroSerie) => {
  // Define a data base como 1º de janeiro de 1900 - (data base do ecxel)
  const dataBase = new Date(1900, 0, 1);

  // Adiciona os dias ao dia base, subtraindo 2 dias para alinhar ao sistema do Excel
  const dataConvertida = addDays(dataBase, numeroSerie - 2);

  // Formata a data para uma string legível
  return dataConvertida;
};

module.exports = { formatarDataOmie, converterNumeroSerieParaData };
