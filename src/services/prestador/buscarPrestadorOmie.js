const clienteService = require("../omie/clienteService");

const buscarPrestadorOmie = async ({ prestador, appKey, appSecret }) => {
  if (prestador?.codigo_cliente_omie) {
    return await clienteService.pesquisarCodClienteOmie(
      appKey,
      appSecret,
      prestador?.codigo_cliente_omie
    );
  }

  if (prestador?.documento) {
    return await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      prestador.documento
    );
  }

  return null;
};

const omieToPrestador = async ({ event }) => {
  const documento = event?.cnpj_cpf
    ? Number(event.cnpj_cpf.replace(/[.\-\/]/g, ""))
    : null;

  return {
    nome: event.razao_social,
    tipo:
      event?.exterior === "S"
        ? "ext"
        : event?.pessoa_fisica === "S"
          ? "pf"
          : "pj",
    documento,
    codigo_cliente_omie: event?.codigo_cliente_omie,
    dadosBancarios: {
      banco: event?.dadosBancarios?.codigo_banco ?? "",
      agencia: event?.dadosBancarios?.agencia ?? "",
      conta: event?.dadosBancarios?.conta_corrente ?? "",
    },
    email: event?.email,
    endereco: {
      cep: event?.cep ?? "",
      rua: event?.endereco ?? "",
      numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
      complemento: event?.complemento ?? complemento,
      cidade: event?.cidade ?? "",
      estado: event?.estado ?? "",
    },
  };
};

module.exports = {
  omieToPrestador,
  buscarPrestadorOmie,
};
