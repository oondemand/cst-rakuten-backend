const apiOmie = require("../../config/apiOmie");
// const { logger } = require("../../config/msLogger");

const criarFornecedor = ({
  codigo_cliente_integracao,
  documento,
  nome,
  sid,
  tipo,
  email,
  banco,
  agencia,
  conta,
  tipoConta,
  cep,
  rua,
  numeroDoEndereco,
  complemento,
  cidade,
  estado,
  pessoaFisica,
  dataNascimento,
  pis,
  nomeMae,
  numeroRg,
  orgaoEmissorRg,
  razaoSocial,
  nomeFantasia,
  codigoCNAE,
  codigoServicoNacional,
  regimeTributario,
  observacao,
}) => {
  const cliente = {
    codigo_cliente_integracao,
    cnpj_cpf: documento,
    razao_social: nome.substring(0, 60),
    tags: ["Fornecedor"],
    nome_fantasia: razaoSocial ? razaoSocial.substring(0, 60) : "",
    endereco: rua ? rua : "",
    endereco_numero: numeroDoEndereco ? numeroDoEndereco : "",
    complemento: complemento ? complemento : "",
    estado: estado ? estado : "",
    cidade: cidade ? cidade : "",
    cep: cep ? cep : "",
    email: email ? email : "",
    observacao: observacao ? observacao : "",
    pessoa_fisica: tipo == "pf" ? "S" : "N",
    importado_api: "S",
  };

  cliente.dadosBancarios = {
    codigo_banco: banco ? banco.toString() : "",
    agencia: agencia ? agencia : "",
    conta_corrente: conta ? conta : "",
    doc_titular: documento ? documento : "",
    nome_titular: nome ? nome : "",
  };

  if (tipoConta == "poupanca") {
    observacao
      ? (cliente.observacao += "\n\n conta poupança")
      : (cliente.observacao = "conta poupança");
  }

  return cliente;
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

const incluir = async (appKey, appSecret, cliente, maxTentativas = 3) => {
  let tentativas = 0;
  let erroEncontrado;
  while (tentativas < maxTentativas) {
    try {
      const body = {
        call: "IncluirCliente",
        app_key: appKey,
        app_secret: appSecret,
        param: [cliente],
      };

      const response = await apiOmie.post("geral/clientes/", body);
      return response.data;
    } catch (error) {
      tentativas++;
      if (
        error.response?.data?.faultstring?.includes(
          "Consumo redundante detectado"
        )
      ) {
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      }

      erroEncontrado =
        error.response?.data?.faultstring ||
        error.response?.data ||
        error.response ||
        error;

      // console.error(`Falha ao criar cliente: ${erroEncontrado}`);
    }
  }

  throw `Falha ao criar cliente após ${maxTentativas} tentativas. ${erroEncontrado}`;
};

const update = async (appKey, appSecret, cliente, maxTentativas = 3) => {
  let tentativas = 0;
  let erroEncontrado;

  while (tentativas < maxTentativas) {
    try {
      const body = {
        call: "AlterarCliente",
        app_key: appKey,
        app_secret: appSecret,
        param: [cliente],
      };

      const response = await apiOmie.post("geral/clientes/", body);
      return response.data;
    } catch (error) {
      tentativas++;
      if (
        error.response?.data?.faultstring?.includes(
          "Consumo redundante detectado"
        )
      ) {
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      }

      erroEncontrado =
        error.response?.data?.faultstring ||
        error.response?.data ||
        error.response ||
        error;

      // console.error(`Falha ao atualizar cliente: ${erroEncontrado}`);
    }
  }

  throw `Falha ao atualizar cliente após ${maxTentativas} tentativas. ${erroEncontrado}`;
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

module.exports = {
  criarFornecedor,
  incluir,
  pesquisarPorCNPJ,
  consultar,
  update,
};
