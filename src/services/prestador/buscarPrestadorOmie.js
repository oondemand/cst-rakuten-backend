const clienteService = require("../omie/clienteService");

const buscarPrestadorOmie = async ({ prestador, appKey, appSecret }) => {
  if (prestador?.codigo_cliente_omie) {
    const cliente = await clienteService.consultar(
      appKey,
      appSecret,
      prestador?.codigo_cliente_omie
    );

    return cliente;
  }

  if (prestador?.documento) {
    const clientes = await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      prestador.documento
    );

    if (clientes && clientes.length > 1) {
      const cliente = clientes.find((item) => {
        return item?.caracteristicas?.some(
          (caracteristica) =>
            caracteristica.campo?.toLowerCase() === "sid" &&
            caracteristica.conteudo == prestador.sid
        );
      });

      return cliente;
    }

    if (clientes && clientes.length === 1) {
      return clientes[0];
    }
  }

  return null;
};

module.exports = {
  buscarPrestadorOmie,
};
