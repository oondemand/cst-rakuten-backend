const Ticket = require("../models/Ticket");
const Etapa = require("../models/Etapa");
const BaseOmie = require("../models/BaseOmie");
const contaPagarService = require("../services/omie/contaPagarService");
const clienteService = require("../services/omie/clienteService");
const Arquivo = require("../models/Arquivo");

const fs = require("fs");

const anexoService = require("../services/omie/anexosService");

const Prestador = require("../models/Prestador");
const Servico = require("../models/Servico");

const { add } = require("date-fns");

// Função para aprovar um ticket
const aprovar = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Buscar o ticket pelo ID
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .send({ success: false, message: "Ticket não encontrado." });
    }

    // Carregar as etapas do banco de dados, ordenadas pela posição
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    const currentEtapaIndex = etapas.findIndex(
      (etapa) => etapa.codigo === ticket.etapa,
    );

    if (currentEtapaIndex < 0) {
      return res
        .status(400)
        .send({ success: false, message: "Etapa inválida." });
    }

    // Se estiver na última etapa antes de "conta-pagar", mover para "conta-pagar" e gerar a conta
    if (currentEtapaIndex === etapas.length - 1) {
      ticket.etapa = "integracao-omie";
      ticket.status = "aguardando-inicio";

      // Gerar conta a pagar
      const conta = await gerarContaPagar(ticket);
      ticket.contaPagarOmie = conta.codigo_lancamento_omie;

      // Fazer upload dos arquivos
      const arquivo = await uploadDeArquivosOmie(ticket, ticket.contaPagarOmie);

      // await ticket.save();
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
    res.status(500).send({
      success: false,
      message: "Erro ao aprovar ticket",
      detalhes: error,
    });
  }
};

// Função para recusar um ticket
const recusar = async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Buscar o ticket pelo ID
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res
        .status(404)
        .send({ success: false, message: "Ticket não encontrado." });
    }

    // Carregar as etapas do banco de dados, ordenadas pela posição
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    const currentEtapaIndex = etapas.findIndex(
      (etapa) => etapa.codigo === ticket.etapa,
    );

    if (currentEtapaIndex < 0) {
      return res
        .status(400)
        .send({ success: false, message: "Etapa inválida." });
    }

    // Se estiver na primeira etapa, exclui o ticket ao recusar
    // if (currentEtapaIndex === 0) {
    //   await Ticket.findByIdAndDelete(ticketId);
    //   return res.status(200).send({ success: true, message: "Ticket excluído com sucesso." });
    // }

    // Retrocede uma etapa e muda status para 'revisao'
    if (currentEtapaIndex > 0)
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
  const baseOmie = await BaseOmie.findOne({ status: "ativo" });
  const prestador = await Prestador.findById(ticket.prestador);

  if (!baseOmie) throw `BaseOmie não encontrada`;

  const codigoFornecedor = await obterOuCadastrarFornecedor(
    baseOmie.appKey,
    baseOmie.appSecret,
    prestador.documento,
    prestador.nome,
  );

  const conta = await cadastrarContaAPagar(
    baseOmie.appKey,
    baseOmie.appSecret,
    codigoFornecedor,
    ticket,
  );

  return conta;
};

const obterOuCadastrarFornecedor = async (appKey, appSecret, cnpj, nome) => {
  try {
    let fornecedor = await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      cnpj,
    );

    let codigoFornecedor = fornecedor ? fornecedor.codigo_cliente_omie : null;

    if (!codigoFornecedor) {
      const novoFornecedor = clienteService.criarFornecedor(cnpj, nome);
      const fornecedorCadastrado = await clienteService.incluir(
        appKey,
        appSecret,
        novoFornecedor,
      );
      codigoFornecedor = fornecedorCadastrado.codigo_cliente_omie;
    }

    return codigoFornecedor;
  } catch (error) {
    throw `Erro ao obter ou cadastrar fornecedor: ${error}`;
  }
};

const cadastrarContaAPagar = async (
  appKey,
  appSecret,
  codigoFornecedor,
  ticket,
) => {
  try {
    let valorTotalDaNota = 0;

    for (const id of ticket.servicos) {
      const { valorTotal } = await Servico.findById(id);
      valorTotalDaNota += valorTotal;
    }

    if (valorTotalDaNota === 0) {
      console.error("Valor do serviço é zero. Não será gerada conta a pagar.");
      return;
    }

    const dataDaEmissão = new Date();

    const conta = contaPagarService.criarConta({
      numeroDocumento: 1,
      numeroDocumentoFiscal: 1,
      codigoFornecedor: codigoFornecedor,
      dataEmissao: dataDaEmissão,
      dataVencimento: add(dataDaEmissão, { hours: 24 }), // 24 horas a mais
      descrição: "Serviços prestados",
      valor: valorTotalDaNota,
    });

    return await contaPagarService.incluir(appKey, appSecret, conta);
  } catch (error) {
    throw `Erro ao cadastrar conta a pagar: ${error}`;
  }
};

const uploadDeArquivosOmie = async (ticket, nId) => {
  const baseOmie = await BaseOmie.findOne({ status: "ativo" });

  const uploadFile = async (id) => {
    const arquivo = await Arquivo.findById(id);

    if (arquivo) {
      const buffer = fs.readFileSync(arquivo.path);

      await anexoService.incluir({
        appKey: baseOmie.appKey,
        appSecret: baseOmie.appSecret,
        tabela: "conta-pagar",
        nId,
        nomeArquivo: arquivo.nomeOriginal,
        tipoArquivo: arquivo.mimetype,
        arquivo: buffer,
      });
    }
  };

  try {
    const results = await Promise.all(
      ticket.arquivos.map((id) => uploadFile(id)),
    );
  } catch (error) {
    console.log("Erro ao anexar arquivo: ", error);
    throw `Erro ao anexar arquivo ${error}`;
  }
};

module.exports = { aprovar, recusar };
