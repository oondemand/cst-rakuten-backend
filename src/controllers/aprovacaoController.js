const Ticket = require("../models/Ticket");
const Etapa = require("../models/Etapa");
const Empresa = require("../models/Empresa");
const contaPagarService = require("../services/omie/contaPagarService");
const clienteService = require("../services/omie/clienteService");

// Função para aprovar um ticket
const aprovar = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Buscar o ticket pelo ID
    const ticket = await Ticket.findById(ticketId).populate("nfse");
    if (!ticket) {
      return res.status(404).send({ success: false, message: "Ticket não encontrado." });
    }

    // Carregar as etapas do banco de dados, ordenadas pela posição
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    const currentEtapaIndex = etapas.findIndex((etapa) => etapa.codigo === ticket.etapa);

    if (currentEtapaIndex < 0) {
      return res.status(400).send({ success: false, message: "Etapa inválida." });
    }

    // Se estiver na última etapa antes de "conta-pagar", mover para "conta-pagar" e gerar a conta
    if (currentEtapaIndex === etapas.length - 1) {
      ticket.etapa = "conta-pagar";
      ticket.status = "aguardando-inicio";

      // Gerar conta a pagar
      const conta = await gerarContaPagar(ticket);
      ticket.contaPagarOmie = conta.codigo_lancamento_omie;

      await ticket.save();
      return res.send({
        success: true,
        message: `Ticket movido para a etapa "conta-pagar" e conta gerada.`,
      });
    }

    // Passa para a próxima etapa
    ticket.etapa = etapas[currentEtapaIndex + 1].codigo;
    ticket.status = "aguardando-inicio";

    await ticket.save();
    res.send({
      success: true,
      message: `Ticket aprovado e movido para a etapa: ${ticket.etapa}`,
    });
  } catch (error) {
    console.error("Erro ao aprovar ticket:", error);
    res.status(500).send({ success: false, message: "Erro ao aprovar ticket", detalhes: error });
  }
};

// Função para recusar um ticket
const recusar = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Buscar o ticket pelo ID
    const ticket = await Ticket.findById(ticketId).populate("nfse");
    if (!ticket) {
      return res.status(404).send({ success: false, message: "Ticket não encontrado." });
    }

    // Carregar as etapas do banco de dados, ordenadas pela posição
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    const currentEtapaIndex = etapas.findIndex((etapa) => etapa.codigo === ticket.etapa);

    if (currentEtapaIndex < 0) {
      return res.status(400).send({ success: false, message: "Etapa inválida." });
    }

    // Se estiver na primeira etapa, exclui o ticket ao recusar
    if (currentEtapaIndex === 0) {
      await Ticket.findByIdAndDelete(ticketId);
      return res.status(200).send({ success: true, message: "Ticket excluído com sucesso." });
    }

    // Retrocede uma etapa e muda status para 'revisao'
    ticket.etapa = etapas[currentEtapaIndex - 1].codigo;
    ticket.status = "revisao";

    await ticket.save();
    res.send({
      success: true,
      message: `Ticket recusado e movido para a etapa: ${ticket.etapa}`,
    });
  } catch (error) {
    console.error("Erro ao recusar ticket:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// Função para gerar a conta a pagar
const gerarContaPagar = async (ticket) => {
  const empresa = await Empresa.findOne({ cnpj: ticket.nfse.infoNfse.tomador.documento });
  if (!empresa)
    throw `Empresa não encontrada para o CNPJ do tomador: ${ticket.nfse.infoNfse.tomador.documento}`;

  const codigoFornecedor = await obterOuCadastrarFornecedor(
    empresa.appKeyOmie,
    empresa.appSecretOmie,
    ticket.nfse.infoNfse.prestador.documento,
    ticket.nfse.infoNfse.prestador.nome
  );

  const conta = await cadastrarContaAPagar(
    empresa.appKeyOmie,
    empresa.appSecretOmie,
    codigoFornecedor,
    ticket.nfse
  );

  return conta;
};

const obterOuCadastrarFornecedor = async (appKey, appSecret, cnpj, nome) => {
  try {
    let fornecedor = await clienteService.pesquisarPorCNPJ(appKey, appSecret, cnpj);
    let codigoFornecedor = fornecedor ? fornecedor.codigo_cliente_omie : null;

    if (!codigoFornecedor) {
      const novoFornecedor = clienteService.criarFornecedor(cnpj, nome);
      const fornecedorCadastrado = await clienteService.incluir(appKey, appSecret, novoFornecedor);
      codigoFornecedor = fornecedorCadastrado.codigo_cliente_omie;
    }

    return codigoFornecedor;
  } catch (error) {
    throw `Erro ao obter ou cadastrar fornecedor: ${error}`;
  }
};

const cadastrarContaAPagar = async (appKey, appSecret, codigoFornecedor, nfse) => {
  try {
    const conta = contaPagarService.criarConta(
      nfse.infoNfse.numero,
      nfse.infoNfse.numero,
      codigoFornecedor,
      nfse.infoNfse.dataEmissao,
      nfse.infoNfse.dataEmissao,
      nfse.infoNfse.declaracaoPrestacaoServico.servico.discriminacao,
      nfse.infoNfse.declaracaoPrestacaoServico.servico.valores.valorServicos
    );

    if (nfse.infoNfse.declaracaoPrestacaoServico.servico.valores.valorServicos == 0) {
      console.error("Valor da NFSe é zero. Não será gerada conta a pagar.");
      return;
    }

    return await contaPagarService.incluir(appKey, appSecret, conta);
  } catch (error) {
    throw `Erro ao cadastrar conta a pagar: ${error}`;
  }
};

module.exports = { aprovar, recusar };
