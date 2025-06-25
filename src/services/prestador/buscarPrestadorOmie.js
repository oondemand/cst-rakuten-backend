const clienteService = require("../omie/clienteService");

exports.buscarPrestadorOmie = async ({ prestador, appKey, appSecret }) => {
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
