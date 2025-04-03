const apiOmie = require("../../config/apiOmie");

const ContaCorrenteService = {
  obterContaAdiamentoCliente: async ({ baseOmie }) => {
    try {
      const body = {
        call: "ListarContasCorrentes",
        app_key: baseOmie.appKey,
        app_secret: baseOmie.appSecret,
        param: [
          {
            pagina: 1,
            registros_por_pagina: 900,
            apenas_importado_api: "N",
          },
        ],
      };

      const { data } = await apiOmie.post("geral/contacorrente/", body);

      return data;
    } catch (error) {
      console.error(
        `Ouve um erro ao obter conta corrente [Adiamento do Cliente], erro: ${error}`
      );
    }
  },
};

module.exports = ContaCorrenteService;
