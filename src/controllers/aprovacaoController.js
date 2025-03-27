const Ticket = require("../models/Ticket");
const Etapa = require("../models/Etapa");
const BaseOmie = require("../models/BaseOmie");
const contaPagarService = require("../services/omie/contaPagarService");
const clienteService = require("../services/omie/clienteService");
const emailUtils = require("../utils/emailUtils");

const anexoService = require("../services/omie/anexosService");

const Prestador = require("../models/Prestador");
const Servico = require("../models/Servico");

const { add, format } = require("date-fns");
const { ControleAlteracaoService } = require("../services/controleAlteracao");
const ContaPagar = require("../models/ContaPagar");
const { ja } = require("date-fns/locale");

// Função para aprovar um ticket
const aprovar = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId)
      .populate("arquivos")
      .populate("servicos")
      .populate("prestador");

    if (!ticket) {
      return res
        .status(404)
        .send({ success: false, message: "Ticket não encontrado." });
    }

    // Carregar as etapas do banco de dados, ordenadas pela posição
    const etapas = await Etapa.find({ status: "ativo" }).sort({ posicao: 1 });
    const currentEtapaIndex = etapas.findIndex(
      (etapa) => etapa.codigo === ticket.etapa
    );

    if (currentEtapaIndex < 0) {
      return res
        .status(400)
        .send({ success: false, message: "Etapa inválida." });
    }

    // Se estiver na última etapa antes de "conta-pagar", mover para "conta-pagar" e gerar a conta
    if (currentEtapaIndex === etapas.length - 1) {
      ticket.etapa = "integracao-omie";
      ticket.status = "trabalhando";
      await ticket.save();

      await gerarContaPagar({ ticket, usuario: req.usuario });

      return res.send({
        success: true,
        message: `Ticket movido para a etapa "conta-pagar" e conta gerada.`,
      });
    }

    if (!["requisicao", "aprovacao-cadastro"].includes(ticket.etapa)) {
      ticket.etapa = etapas[currentEtapaIndex + 1].codigo;
    }

    if (ticket?.etapa === "aprovacao-cadastro") {
      ticket.etapa = etapas[currentEtapaIndex + 1].codigo;

      if (ticket?.prestador?.tipo !== "pf") {
        ticket.etapa = "aprovacao-fiscal";
      }
    }

    if (ticket.etapa === "requisicao") {
      ticket.etapa = etapas[currentEtapaIndex + 1].codigo;

      const jaExisteServicoPago = await Servico.findOne({
        prestador: ticket?.prestador?._id,
        status: "pago",
      });

      if (jaExisteServicoPago) {
        if (ticket?.prestador?.tipo !== "pf") {
          ticket.etapa = "aprovacao-fiscal";
        } else {
          ticket.etapa = "geracao-rpa";
        }
      }
    }

    ticket.status = "aguardando-inicio";
    await ticket.save();

    ControleAlteracaoService.registrarAlteracao({
      acao: "aprovar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: ticket,
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });

    res.send({
      success: true,
      message: `Ticket aprovado e movido para a etapa: ${ticket.etapa}`,
    });
  } catch (error) {
    // console.error("Erro ao aprovar ticket:", error);
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
      (etapa) => etapa.codigo === ticket.etapa
    );

    if (currentEtapaIndex < 0) {
      return res
        .status(400)
        .send({ success: false, message: "Etapa inválida." });
    }

    // Retrocede uma etapa e muda status para 'revisao'
    if (currentEtapaIndex > 0)
      ticket.etapa = etapas[currentEtapaIndex - 1].codigo;

    if (
      ticket.etapa === "aprovacao-fiscal" &&
      ticket.prestador?.tipo !== "pf"
    ) {
      ticket.etapa = etapas[currentEtapaIndex - 2].codigo;
    }

    ticket.status = "revisao";

    await ticket.save();
    ControleAlteracaoService.registrarAlteracao({
      acao: "reprovar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: ticket,
      tipoRegistroAlterado: "ticket",
      usuario: req.usuario._id,
    });
    res.send({
      success: true,
      message: `Ticket recusado e movido para a etapa: ${ticket.etapa}`,
    });
  } catch (error) {
    // console.error("Erro ao recusar ticket:", error);
    res.status(500).send({ success: false, error: error.message });
  }
};

// Função para gerar a conta a pagar
const gerarContaPagar = async ({ ticket, usuario }) => {
  try {
    const baseOmie = await BaseOmie.findOne({ status: "ativo" });

    if (!baseOmie) throw "Base omie não encontrada";

    // Busca um prestador
    const fornecedor = await atualizarOuCriarFornecedor({
      appKey: baseOmie.appKey,
      appSecret: baseOmie.appSecret,
      prestadorId: ticket.prestador,
    });

    // console.log(fornecedor);

    // Caso ticket nã tenha serviços adiciona anexo ao prestador
    if (ticket.servicos.length === 0) {
      await uploadDeArquivosOmie({
        ticket,
        nId: fornecedor.codigo_cliente_omie,
        tabela: "cliente",
      });

      ticket.status = "concluido";
      return await ticket.save();
    }

    // caso ticket tenha serviço tenta criar uma conta
    let conta = await cadastrarContaAPagar(
      baseOmie,
      fornecedor.codigo_cliente_omie,
      ticket
    );

    //caso tenha uma conta tenta fazer o upload de arquivos
    if (conta) {
      try {
        await uploadDeArquivosOmie({
          ticket,
          nId: conta.codigo_lancamento_omie,
          tabela: "conta-pagar",
        });
      } catch (error) {
        // caso tenha algum erro no upload de arquivos, tenta remover a conta
        // console.error(error);
        try {
          await contaPagarService.remover({
            codigo_lancamento_integracao: conta.codigo_lancamento_integracao,
            codigo_lancamento_omie: conta.codigo_lancamento_omie,
            appKey: baseOmie.appKey,
            appSecret: baseOmie.appSecret,
          });

          throw error;
        } catch (error) {
          //caso de erro ao remover a conta repassa o erro
          // console.error(error);
          throw error;
        }
      }
    }

    // caso de tudo certo, vincula codigo da conta o ticket, muda o status e salva
    ticket.contaPagarOmie = conta._id;
    ticket.status = "concluido";
    await ticket.save();

    ControleAlteracaoService.registrarAlteracao({
      acao: "aprovar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: ticket,
      tipoRegistroAlterado: "ticket",
      usuario: usuario._id,
    });
  } catch (error) {
    // se ocorrer qualquer erro, volta ticket para etapa de aprovação, criar obs e atualiza o status
    ticket.observacao += `\n ${error} - ${format(new Date(), "dd/MM/yyyy")}`;
    ticket.etapa = "aprovacao-fiscal";
    ticket.status = "revisao";
    await ticket.save();

    ControleAlteracaoService.registrarAlteracao({
      acao: "aprovar",
      dataHora: new Date(),
      idRegistroAlterado: ticket._id,
      origem: "formulario",
      dadosAtualizados: ticket,
      tipoRegistroAlterado: "ticket",
      usuario: usuario._id,
    });

    await emailUtils.emailErroIntegracaoOmie({
      error: error,
      usuario: usuario,
    });
  }
};

const atualizarOuCriarFornecedor = async ({
  appKey,
  appSecret,
  prestadorId,
}) => {
  try {
    let banco = "";

    const prestador = await Prestador.findById(prestadorId);

    let fornecedor = null;

    fornecedor = await clienteService.pesquisarPorCNPJ(
      appKey,
      appSecret,
      prestador.documento
    );

    if (!fornecedor) {
      fornecedor = await clienteService.pesquisarCodIntegracao(
        appKey,
        appSecret,
        prestador._id
      );
    }

    const novoFornecedor = clienteService.criarFornecedor({
      documento: prestador.documento,
      nome: prestador.nome,
      tipo: prestador.tipo,
      email: prestador.email,
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
      novoFornecedor.codigo_cliente_integracao =
        fornecedor.codigo_cliente_integracao;

      novoFornecedor.codigo_cliente_omie = fornecedor.codigo_cliente_omie;

      const fornecedorCadastrado = await clienteService.update(
        appKey,
        appSecret,
        novoFornecedor
      );

      fornecedor = fornecedorCadastrado;
    }

    if (!fornecedor) {
      novoFornecedor.codigo_cliente_integracao = prestador._id;
      const fornecedorCadastrado = await clienteService.incluir(
        appKey,
        appSecret,
        novoFornecedor
      );

      fornecedor = fornecedorCadastrado;
    }

    return fornecedor;
  } catch (error) {
    throw `Erro ao obter ou cadastrar fornecedor. ${error}`;
  }
};

const cadastrarContaAPagar = async (baseOmie, codigoFornecedor, ticket) => {
  try {
    let valorTotalDaNota = 0;
    let observacao = `Serviços prestados SID - ${ticket.prestador.sid}\n-- Serviços --\n`;

    for (const id of ticket.servicos) {
      const { valor, competencia } = await Servico.findById(id);

      const valorTotalFormatado = valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });

      observacao += `Competência: ${competencia?.mes}/${competencia?.ano} - Valor total: ${valorTotalFormatado}\n`;
      valorTotalDaNota += valor;
    }

    if (valorTotalDaNota === 0) {
      // console.error("Valor do serviço é zero. Não será gerada conta a pagar.");
      return;
    }

    const dataDaEmissão = new Date();

    const conta = contaPagarService.criarConta({
      numeroDocumento: 1,
      numeroDocumentoFiscal: 1,
      codigoFornecedor: codigoFornecedor,
      dataEmissao: dataDaEmissão,
      dataVencimento: add(dataDaEmissão, { hours: 24 }), // 24 horas a mais
      observacao,
      valor: valorTotalDaNota,
      id_conta_corrente: process.env.ID_CONTA_CORRENTE,
      // codigo_categoria: process.env.CODIGO_CATEGORIA,
    });

    const contaPagarOmie = await contaPagarService.incluir(
      baseOmie.appKey,
      baseOmie.appSecret,
      {
        ...conta,
      }
    );

    const contaPagarCompleta = await contaPagarService.consultar(
      baseOmie.appKey,
      baseOmie.appSecret,
      contaPagarOmie.codigo_lancamento_omie
    );

    const contaPagar = new ContaPagar({
      ...contaPagarCompleta,
      baseOmie: baseOmie._id,
    });

    await contaPagar.save();

    return contaPagar;
  } catch (error) {
    throw `Erro ao cadastrar conta a pagar. ${error}`;
  }
};

const uploadDeArquivosOmie = async ({ ticket, nId, tabela }) => {
  if (ticket.arquivos.length === 0) return;

  const baseOmie = await BaseOmie.findOne({ status: "ativo" });

  try {
    for (const arquivo of ticket.arquivos) {
      await anexoService.incluir({
        appKey: baseOmie.appKey,
        appSecret: baseOmie.appSecret,
        tabela,
        nId,
        nomeArquivo: arquivo.nomeOriginal,
        tipoArquivo: arquivo.mimetype,
        arquivo: arquivo.buffer,
      });
    }
  } catch (error) {
    // console.log("Erro ao anexar arquivo:", error);
    throw error;
  }
};

module.exports = { aprovar, recusar };
