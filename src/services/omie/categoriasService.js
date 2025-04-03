const apiOmie = require("../../config/apiOmie");

const CategoriasService = {
  listarCategorias: async ({ baseOmie }) => {
    const body = {
      call: "ListarCategorias",
      app_key: baseOmie.appKey,
      app_secret: baseOmie.appSecret,
      param: [{ pagina: 1, registros_por_pagina: 900 }],
    };

    try {
      const response = await apiOmie.post("geral/categorias/", body);
      return response.data;
    } catch (error) {
      console.error(`Erro ao listar categorias: ${error}`);
      throw error;
    }
  },
};

module.exports = CategoriasService;
