const axios = require("axios");

exports.obterCodigoBanco = async (nomeBanco) => {
  try {
    const response = await axios.get("https://brasilapi.com.br/api/banks/v1");
    const bancos = response.data;

    // Procurar o banco pelo nome
    const banco = bancos.find((b) => b.name === nomeBanco);

    if (banco) {
      return String(banco.code).padStart(3, "0"); // Retorna o código do banco
    } else {
      return "Banco não encontrado";
    }
  } catch (error) {
    // console.error("Erro ao consultar a API:", error);
    return "";
  }
};
