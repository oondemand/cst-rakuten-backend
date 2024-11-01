const { format } = require("date-fns");
const { ptBR } = require("date-fns/locale");

const formatarDataOmie = (data) => {
  return format(data, "dd/MM/yyyy", { locale: ptBR });
};

module.exports = { formatarDataOmie };
