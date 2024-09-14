const crypto = require("crypto");
const apiOmie = require("../../config/apiOmie");
// const { logger } = require("../../config/msLogger");

const criarFornecedor = (cnpj, nome) => {
  const cliente = {
    codigo_cliente_integracao: crypto.randomUUID(),
    cnpj_cpf: cnpj,
    razao_social: nome.substring(0, 60),
    tags: ["Fornecedor"],
  };
  return cliente;
};

const cache = {};
const consultar = async (appKey, appSecret, codCliente) => {
  const cacheKey = `cliente_${codCliente}`;
  const now = Date.now();

  // Verificar se o cliente está no cache e se ainda é válido (10 minuto)
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 600000) {
    console.log(`Retornando do cache para o cliente: ${codCliente}`);
    return cache[cacheKey].data;
  }

  try {
    const body = {
      call: "ConsultarCliente",
      app_key: appKey,
      app_secret: appSecret,
      param: [
        {
          codigo_cliente_omie: codCliente,
        },
      ],
    };

    const response = await apiOmie.post("geral/clientes/", body);
    const data = response.data;

    // Armazenar a resposta no cache com um timestamp
    cache[cacheKey] = {
      data: data,
      timestamp: now,
    };

    return data;
  } catch (error) {
    if (error.response?.data?.faultstring?.includes("Consumo redundante detectado"))
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    if (error.response?.data?.faultstring)
      throw "Erro ao consultar cliente: " + error.response.data.faultstring;
    if (error.response?.data) throw "Erro ao consultar cliente: " + error.response.data;
    if (error.response) throw "Erro ao consultar cliente: " + error.response;
    throw "Erro ao consultar cliente: " + error;
  }
};

const incluir = async (appKey, appSecret, cliente) => {
  try {
    const body = {
      call: "IncluirCliente",
      app_key: appKey,
      app_secret: appSecret,
      param: [cliente],
    };

    // console.log(JSON.stringify(body));
    const response = await apiOmie.post("geral/clientes/", body);
    return response.data;
  } catch (error) {
    if (error.response?.data?.faultstring?.includes("Consumo redundante detectado"))
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    if (error.response?.data?.faultstring)
      throw "Erro ao incluir cliente: " + error.response.data.faultstring;
    if (error.response?.data) throw "Erro ao incluir cliente: " + error.response.data;
    if (error.response) throw "Erro ao incluir cliente: " + error.response;
    throw error;
  }
};

const cachePesquisaPorCNPJ = {};
const pesquisarPorCNPJ = async (appKey, appSecret, cnpj) => {
  const cacheKey = `cnpj_${cnpj}`;
  const now = Date.now();

  // Verificar se o CNPJ está no cache e se ainda é válido (10 minuto)
  if (cachePesquisaPorCNPJ[cacheKey] && now - cachePesquisaPorCNPJ[cacheKey].timestamp < 60 * 1000) {
    console.log(`Retornando do cache para o CNPJ: ${cnpj}`);
    return cachePesquisaPorCNPJ[cacheKey].data;
  }

  try {
    const body = {
      call: "ListarClientes",
      app_key: appKey,
      app_secret: appSecret,
      param: [
        {
          pagina: 1,
          registros_por_pagina: 50,
          clientesFiltro: {
            cnpj_cpf: cnpj,
          },
        },
      ],
    };

    // console.log(JSON.stringify(body));
    const response = await apiOmie.post("geral/clientes/", body);
    const data = response.data?.clientes_cadastro[0];

    // Armazenar a resposta no cache com um timestamp
    cachePesquisaPorCNPJ[cacheKey] = {
      data: data,
      timestamp: now,
    };

    return data;
  } catch (error) {
    if (error.response?.data?.faultstring?.includes("Não existem registros para a página"))
      return null;

    if (error.response?.data?.faultstring?.includes("Consumo redundante detectado"))
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    if (error.response?.data?.faultstring)
      throw "Erro ao pesquisar cliente por CNPJ: " + error.response.data.faultstring;
    if (error.response?.data) throw "Erro ao pesquisar cliente por CNPJ:" + error.response.data;
    if (error.response) throw "Erro ao pesquisar cliente por CNPJ: " + error.response;
    throw error;
  }
};

module.exports = { criarFornecedor, incluir, pesquisarPorCNPJ, consultar };
