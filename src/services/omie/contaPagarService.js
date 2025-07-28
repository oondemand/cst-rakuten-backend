const crypto = require("crypto");
const apiOmie = require("../../config/apiOmie");

const { formatarDataOmie } = require("../../utils/dateUtils");

const criarConta = ({
  numeroDocumento,
  numeroDocumentoFiscal,
  codigoFornecedor,
  dataEmissao,
  dataVencimento,
  observacao,
  valor,
  dataRegistro,
  notaFiscal,
  codigo_categoria,
}) => {
  const conta = {
    codigo_lancamento_integracao: crypto.randomUUID(),
    numero_documento: "oon-" + numeroDocumento,
    numero_documento_fiscal: numeroDocumentoFiscal,
    codigo_cliente_fornecedor: codigoFornecedor,
    valor_documento: parseFloat(valor),
    data_emissao: formatarDataOmie(dataEmissao),
    data_vencimento: formatarDataOmie(dataVencimento),
    data_previsao: formatarDataOmie(dataVencimento),
    data_entrada: formatarDataOmie(dataRegistro),
    numero_documento_fiscal: notaFiscal,
    codigo_categoria: codigo_categoria ?? "",
    observacao,
  };

  // if (dadosNFSe.pis && dadosNFSe.pis > 0) {
  //   conta.valor_pis = parseFloat(dadosNFSe.pis);
  //   conta.retem_pis = "S";
  // }

  // if (dadosNFSe.cofins && dadosNFSe.cofins > 0) {
  //   conta.valor_cofins = parseFloat(dadosNFSe.cofins);
  //   conta.retem_cofins = "S";
  // }

  // if (dadosNFSe.csll && dadosNFSe.csll > 0) {
  //   conta.valor_csll = parseFloat(dadosNFSe.csll);
  //   conta.retem_csll = "S";
  // }

  // if (dadosNFSe.ir && dadosNFSe.ir > 0) {
  //   conta.valor_ir = parseFloat(dadosNFSe.ir);
  //   conta.retem_ir = "S";
  // }

  // // if (dadosNFSe.iss && dadosNFSe.iss > 0) {
  // //   conta.valor_iss = parseFloat(dadosNFSe.iss);
  // //   conta.retem_iss = "S";
  // // }

  // if (dadosNFSe.inss && dadosNFSe.inss > 0) {
  //   conta.valor_inss = parseFloat(dadosNFSe.inss);
  //   conta.retem_inss = "S";
  // }
  return conta;
};

const incluir = async (appKey, appSecret, conta, maxTentativas = 3) => {
  // let tentativas = 0;
  // let erroEncontrado;

  // while (tentativas < maxTentativas) {
  // console.log(
  //   `[CONTA A PAGAR]: Criando conta a pagar tentativa ${tentativas + 1}`
  // );
  // try {
  const body = {
    call: "IncluirContaPagar",
    app_key: appKey,
    app_secret: appSecret,
    param: [conta],
  };

  const response = await apiOmie.post("financas/contapagar/", body);
  return response.data;
  // } catch (error) {
  //   tentativas++;
  //   if (
  //     error.response?.data?.faultstring?.includes(
  //       "Consumo redundante detectado"
  //     )
  //   ) {
  //     await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
  //   }

  //   erroEncontrado =
  //     error.response?.data?.faultstring ||
  //     error.response?.data ||
  //     error.response ||
  //     error;

  // console.log(`Falha ao criar conta a pagar: ${erroEncontrado}`);
  // }
  // }

  // throw `Falha ao criar conta a pagar após ${maxTentativas} tentativas. ${erroEncontrado}`;
};

const remover = async (
  { appKey, appSecret, codigo_lancamento_omie, codigo_lancamento_integracao },
  maxTentativas = 5
) => {
  let tentativas = 0;
  let erroEncontrado;
  while (tentativas < maxTentativas) {
    try {
      // console.log(
      //   `[CONTA A PAGAR/REMOVER CONTA]: Tentando remover conta, ${tentativas + 1} tentativa`
      // );

      const body = {
        call: "ExcluirContaPagar",
        app_key: appKey,
        app_secret: appSecret,
        param: [{ codigo_lancamento_integracao, codigo_lancamento_omie }],
      };

      const response = await apiOmie.post("financas/contapagar/", body);
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

      // console.log(`Erro ao remover conta a pagar: ${erroEncontrado}`);
    }
  }

  throw `Erro ao remover conta a pagar após ${maxTentativas} tentativas. ${erroEncontrado}`;
};

const cache = {};
const queue = [];
let isProcessing = false;

const processQueue = async () => {
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const { appKey, appSecret, codigoLancamento, resolve, reject } =
    queue.shift();

  try {
    const result = await consultarInterno(appKey, appSecret, codigoLancamento);
    resolve(result);
  } catch (error) {
    reject(error);
  }

  setTimeout(processQueue, 300); // Processa a próxima consulta após 1 segundo
};

const consultar = (appKey, appSecret, codigoLancamento) => {
  return new Promise((resolve, reject) => {
    queue.push({ appKey, appSecret, codigoLancamento, resolve, reject });

    if (!isProcessing) {
      processQueue();
    }
  });
};

const consultarInterno = async (appKey, appSecret, codigoLancamento) => {
  const cacheKey = `${appKey}-${appSecret}-${codigoLancamento}`;
  const now = Date.now();

  // Verifica se o resultado está no cache e se não está expirado
  const cacheExpirationTime = 1 * 60 * 1000 * 10; // 10 min

  if (
    cache[cacheKey] &&
    now - cache[cacheKey].timestamp < cacheExpirationTime
  ) {
    // console.log("Retornando resultado do cache");
    return cache[cacheKey].data;
  }

  try {
    // console.log("Retornando resultado do omie");
    const body = {
      call: "ConsultarContaPagar",
      app_key: appKey,
      app_secret: appSecret,
      param: [
        {
          codigo_lancamento_omie: codigoLancamento,
        },
      ],
    };

    const response = await apiOmie.post("financas/contapagar/", body);

    // console.log("LOG IMPORTANTE ->", response);

    // Armazena o resultado no cache
    cache[cacheKey] = {
      data: response.data,
      timestamp: now,
    };

    return response.data;
  } catch (error) {
    if (
      error?.response?.data?.faultstring.includes(
        "Lançamento não cadastrado para o Código"
      )
    ) {
      return null;
    }

    if (
      error.response?.data?.faultstring?.includes(
        "Consumo redundante detectado"
      )
    )
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));

    if (error.response?.data?.faultstring)
      throw (
        "Erro ao consultar financas/contapaga: " +
        error.response.data.faultstring
      );
    if (error.response?.data)
      throw "Erro ao consultar financas/contapaga: " + error.response.data;
    if (error.response)
      throw "Erro ao consultar financas/contapaga: " + error.response;
    throw "Erro ao consultar financas/contapaga: " + error;
  }
};

module.exports = { criarConta, incluir, consultar, remover };
