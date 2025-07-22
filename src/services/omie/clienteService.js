const apiOmie = require("../../config/apiOmie");

const criarFornecedor = ({ prestador }) => {
  try {
    const observacao =
      prestador?.tipoConta === "poupanca" ? "Tipo de conta: Poupança" : "";

    const cliente = {
      tags: ["Fornecedor"],
      cnpj_cpf: prestador?.documento,
      razao_social: prestador?.nome?.substring(0, 60),
      nome_fantasia: prestador?.nome?.substring(0, 60),
      endereco: prestador?.endereco?.rua,
      cidade: prestador?.endereco?.cidade,
      estado: prestador?.endereco?.estado,
      codigo_pais: prestador?.endereco?.pais?.cod,
      endereco_numero: prestador?.endereco?.numero,
      complemento: prestador?.endereco?.complemento,
      cep: prestador?.endereco?.cep,
      email: prestador?.email,
      dadosBancarios: {
        codigo_banco: prestador?.dadosBancarios?.banco,
        agencia: prestador?.dadosBancarios?.agencia,
        conta_corrente: prestador?.dadosBancarios?.conta,
        doc_titular: prestador?.documento,
        nome_titular: prestador?.nome,
      },
      observacao,
      caracteristicas: [{ campo: "sid", conteudo: prestador?.sid || "" }],
    };

    if (prestador?.tipo === "ext") {
      cliente.cnpj_cpf = "";
      cliente.estado = "EX";
      cliente.cidade = "EX";
      cliente.exterior = "S";
      cliente.nif = prestador?.documento;
    }

    return cliente;
  } catch (error) {
    console.log(error);
    throw new Error("Erro ao formatar cliente/fornecedor: " + error);
  }
};

const cache = {};
const consultar = async (appKey, appSecret, codCliente) => {
  const cacheKey = `cliente_${codCliente}`;
  const now = Date.now();

  // Verificar se o cliente está no cache e se ainda é válido (10 minuto)
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < 600000) {
    // console.log(`Retornando do cache para o cliente: ${codCliente}`);
    return cache[cacheKey].data;
  }

  try {
    const body = {
      call: "ConsultarCliente",
      app_key: appKey,
      app_secret: appSecret,
      exibir_caracteristicas: "S",
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
    if (
      error.response?.data?.faultstring?.includes(
        "Consumo redundante detectado"
      )
    )
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    if (error.response?.data?.faultstring)
      throw "Erro ao consultar cliente: " + error.response.data.faultstring;
    if (error.response?.data)
      throw "Erro ao consultar cliente: " + error.response.data;
    if (error.response) throw "Erro ao consultar cliente: " + error.response;
    throw "Erro ao consultar cliente: " + error;
  }
};

const incluir = async (appKey, appSecret, cliente) => {
  const body = {
    call: "IncluirCliente",
    app_key: appKey,
    app_secret: appSecret,
    param: [cliente],
  };

  const response = await apiOmie.post("geral/clientes/", body);
  return response.data;
};

const update = async (appKey, appSecret, cliente) => {
  const body = {
    call: "AlterarCliente",
    app_key: appKey,
    app_secret: appSecret,
    param: [cliente],
  };

  const response = await apiOmie.post("geral/clientes/", body);
  return response.data;
};

const cachePesquisaPorCNPJ = {};
const pesquisarPorCNPJ = async (appKey, appSecret, cnpj, maxTentativas = 3) => {
  const cacheKey = `cnpj_${cnpj}`;
  const now = Date.now();

  let tentativas = 0;

  // Verificar se o CNPJ está no cache e se ainda é válido (10 minuto)
  if (
    cachePesquisaPorCNPJ[cacheKey] &&
    now - cachePesquisaPorCNPJ[cacheKey].timestamp < 60 * 1000
  ) {
    // console.log(`Retornando do cache para o CNPJ: ${cnpj}`);
    return cachePesquisaPorCNPJ[cacheKey].data;
  }
  while (tentativas < maxTentativas) {
    try {
      const body = {
        call: "ListarClientes",
        app_key: appKey,
        app_secret: appSecret,
        param: [
          {
            pagina: 1,
            registros_por_pagina: 50,
            exibir_caracteristicas: "S",
            clientesFiltro: {
              cnpj_cpf: cnpj,
            },
          },
        ],
      };

      // console.log(JSON.stringify(body));
      const response = await apiOmie.post("geral/clientes/", body);
      const data = response.data?.clientes_cadastro;

      // Armazenar a resposta no cache com um timestamp
      cachePesquisaPorCNPJ[cacheKey] = {
        data: data,
        timestamp: now,
      };

      return data;
    } catch (error) {
      if (
        error.response?.data?.faultstring?.includes(
          "ERROR: Não existem registros para a página [1]!"
        )
      ) {
        return null;
      }

      tentativas++;
      if (
        error.response?.data?.faultstring?.includes(
          "API bloqueada por consumo indevido."
        )
      ) {
        // console.log("Esperando 5 minutos");
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000 * 5));
      }

      if (
        error.response?.data?.faultstring?.includes(
          "Consumo redundante detectado"
        )
      ) {
        // console.log("Aguardando 1 minuto");
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      }
    }
  }

  throw `Falha ao buscar prestador após ${maxTentativas} tentativas.`;
};

const consultarCaracteristicas = async ({
  appKey,
  appSecret,
  codigo_cliente_omie,
}) => {
  try {
    const body = {
      call: "ConsultarCaractCliente",
      app_key: appKey,
      app_secret: appSecret,
      param: [{ codigo_cliente_omie }],
    };

    const response = await apiOmie.post("geral/clientescaract/", body);
    return response?.data?.caracteristicas;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

const alterarCaracteristicas = async ({
  appKey,
  appSecret,
  codigo_cliente_omie,
  campo,
  conteudo,
}) => {
  const body = {
    call: "AlterarCaractCliente",
    app_key: appKey,
    app_secret: appSecret,
    param: [{ codigo_cliente_omie, campo, conteudo }],
  };

  const response = await apiOmie.post("geral/clientescaract/", body);

  return response;
};

module.exports = {
  update,
  incluir,
  consultar,
  criarFornecedor,
  pesquisarPorCNPJ,
  alterarCaracteristicas,
  consultarCaracteristicas,
};
