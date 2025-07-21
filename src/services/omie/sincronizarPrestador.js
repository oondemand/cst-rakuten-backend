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
    documento: prestador.documento,
    nome: prestador.nome,
    tipo: prestador.tipo,
    email: prestador?.email ? prestador?.email : "",
    cep: prestador.endereco ? prestador.endereco.cep : "",
    rua: prestador.endereco ? prestador.endereco.rua : "",
    numeroDoEndereco: prestador.endereco ? prestador.endereco.numero : "",
    complemento: prestador.endereco ? prestador.endereco.complemento : "",
    cidade: prestador.endereco ? prestador.endereco.cidade : "",
    estado: prestador.endereco ? prestador.endereco.estado : "",
    razaoSocial: prestador.nome,
    banco: prestador?.dadosBancarios?.banco ?? "",
    agencia: prestador.dadosBancarios ? prestador.dadosBancarios.agencia : "",
    conta: prestador.dadosBancarios ? prestador.dadosBancarios.conta : "",
    tipoConta: prestador.dadosBancarios
      ? prestador.dadosBancarios.tipoConta
      : "",
    codPais: prestador?.endereco?.pais?.cod,
  });

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
