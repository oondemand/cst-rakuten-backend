const Prestador = require("../../models/Prestador");
const clienteService = require("../omie/clienteService");

const BaseOmie = require("../../models/BaseOmie");
const { buscarPrestadorOmie } = require("../prestador/buscarPrestadorOmie");
const { randomUUID } = require("crypto");

exports.sincronizarPrestador = async ({ prestador }) => {
  const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });

  let fornecedor = await buscarPrestadorOmie({
    appKey,
    appSecret,
    prestador,
  });

  const cliente = clienteService.criarFornecedor({
    prestador,
  });

  console.log("CLIENTE", cliente);

  if (fornecedor) {
    cliente.codigo_cliente_omie = fornecedor.codigo_cliente_omie;
    const fornecedorCadastrado = await clienteService.update(
      appKey,
      appSecret,
      cliente
    );

    return fornecedorCadastrado;
  }

  if (!fornecedor) {
    cliente.codigo_cliente_integracao = randomUUID();
    const fornecedorCadastrado = await clienteService.incluir(
      appKey,
      appSecret,
      cliente
    );

    return fornecedorCadastrado;
  }
};
