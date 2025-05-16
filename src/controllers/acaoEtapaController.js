const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");
const Arquivo = require("../models/Arquivo");
const DocumentoFiscal = require("../models/DocumentoFiscal");

const { addDays, format } = require("date-fns");

const {
  criarPrestadorParaExportacao,
} = require("../services/integracaoRPAs/exportarPrestadores");

const {
  criarServicoParaExportacao,
} = require("../services/integracaoRPAs/exportarServicos");

const emailUtils = require("../utils/emailUtils");

const { criarNomePersonalizado } = require("../utils/formatters");

const { ControleAlteracaoService } = require("../services/controleAlteracao");
const Sistema = require("../models/Sistema");
const { listZipContentsFromBuffer } = require("../utils/zip");
const Importacao = require("../models/Importacao");

const anexarArquivoAoTicket = async ({ arquivo, usuario }) => {
  const sciUnico = arquivo.originalname.replace(".pdf", "").split("_")[2];

  if (!sciUnico || isNaN(sciUnico)) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname}; sciUnico não encontrado no nome do arquivo ou não é um número válido`;
  }

  const prestador = await Prestador.findOne({ sciUnico: sciUnico });

  if (!prestador) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um prestador com sciUnico: ${sciUnico}`;
  }

  const ticket = await Ticket.findOne({
    etapa: "geracao-rpa",
    prestador: prestador?._id,
    status: "trabalhando",
  });

  if (!ticket) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um ticket aberto e com status trabalhando referente ao prestador ${prestador.nome} - sciUnico: ${prestador.sciUnico}`;
  }

  const novoArquivoDoTicket = new Arquivo({
    nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
    nomeOriginal: arquivo.originalname,
    mimetype: arquivo.mimetype,
    size: arquivo.size,
    ticket: ticket._id,
    buffer: arquivo.buffer,
    tipo: "rpa",
  });

  await novoArquivoDoTicket?.save();

  ticket.arquivos.push(novoArquivoDoTicket._id);

  ticket.etapa = "aprovacao-fiscal";
  ticket.status = "aguardando-inicio";

  await ticket.save();

  ControleAlteracaoService.registrarAlteracao({
    acao: "alterar",
    dataHora: new Date(),
    idRegistroAlterado: ticket._id,
    origem: "integracao-sci",
    dadosAtualizados: ticket,
    tipoRegistroAlterado: "ticket",
    usuario: usuario._id,
  });

  return ticket;
};

const criarDocumentoFiscal = async ({ arquivo, usuario }) => {
  const filename = arquivo.originalname.replace(".pdf", "").split("_");

  const sciUnico = filename[2];
  const numero = filename[1];

  if (!sciUnico || isNaN(sciUnico) || !numero) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname}; sciUnico não encontrado no nome do arquivo ou não é um número válido`;
  }

  const prestador = await Prestador.findOne({ sciUnico: sciUnico });

  if (!prestador) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um prestador com sciUnico: ${sciUnico}`;
  }

  const ticket = await Ticket.findOne({
    etapa: "geracao-rpa",
    prestador: prestador?._id,
    status: "trabalhando",
  }).populate("servicos");

  if (!ticket) {
    throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um ticket aberto e com status trabalhando referente ao prestador ${prestador.nome} - sciUnico: ${prestador.sciUnico}`;
  }

  const valorTotal = ticket?.servicos?.reduce((acc, curr) => {
    acc = acc + curr.valor;
    return acc;
  }, 0);

  const novoArquivoDoTicket = new Arquivo({
    nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
    nomeOriginal: arquivo.originalname,
    mimetype: arquivo.mimetype,
    size: arquivo.size,
    ticket: ticket._id,
    buffer: arquivo.buffer,
    tipo: "documento-fiscal",
  });

  await novoArquivoDoTicket?.save();

  const documentoFiscal = new DocumentoFiscal({
    numero,
    prestador: prestador._id,
    arquivo: novoArquivoDoTicket._id,
    valor: valorTotal,
    tipoDocumentoFiscal: "rpa",
    status: "processando",
    statusValidacao: "aprovado",
  });

  await documentoFiscal.save();
  ticket.documentosFiscais.push(documentoFiscal._id);

  ticket.etapa = "aprovacao-fiscal";
  ticket.status = "aguardando-inicio";

  await ticket.save();

  ControleAlteracaoService.registrarAlteracao({
    acao: "alterar",
    dataHora: new Date(),
    idRegistroAlterado: ticket._id,
    origem: "integracao-sci",
    dadosAtualizados: ticket,
    tipoRegistroAlterado: "ticket",
    usuario: usuario._id,
  });

  return ticket;
};

const processarArquivos = async ({ arquivos, usuario }) => {
  const detalhes = {
    totalDeArquivosEncontrados: arquivos.length,
    arquivosComErro: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const arquivo of arquivos) {
    try {
      // await anexarArquivoAoTicket({ arquivo, usuario });
      await criarDocumentoFiscal({ arquivo, usuario });
    } catch (error) {
      arquivoDeErro.push(arquivo);
      detalhes.arquivosComErro += 1;
      detalhes.errors += `❌ [ERROR AO ANEXAR ARQUIVO]: NOME DO ARQUIVO: ${arquivo?.nome} \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarRPAs = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const zipMimeTypes = ["application/zip", "application/x-zip-compressed"];
    const pdfMimeType = ["application/pdf"];

    if (!arquivo) {
      return res.status(400).json({ message: "Nenhum arquivo foi fornecido!" });
    }

    const importacao = new Importacao({
      tipo: "rpa",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (importacao) res.status(200).json(importacao);

    if (zipMimeTypes.includes(arquivo?.mimetype)) {
      const arquivos = listZipContentsFromBuffer(arquivo.buffer);
      const { detalhes } = await processarArquivos({
        arquivos,
        usuario: req.usuario,
      });

      importacao.arquivoLog = Buffer.from(detalhes.errors);
      importacao.detalhes = detalhes;

      await importacao.save();
    }

    if (pdfMimeType.includes(arquivo?.mimetype)) {
      const { detalhes } = await processarArquivos({
        arquivos: [arquivo],
        usuario: req.usuario,
      });

      importacao.arquivoLog = Buffer.from(detalhes.errors);
      importacao.detalhes = detalhes;

      await importacao.save();
    }
  } catch (error) {
    res.status(500).json();
    console.error(error);
  }
};

exports.exportarServicos = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      etapa: "geracao-rpa",
      status: { $ne: "concluido" },
    })
      .populate("servicos")
      .populate("prestador");

    if (!tickets) {
      return res.status(400).json({
        mensagem: "Não foram encontrados tickets a serem exportados",
      });
    }

    let documento = "";
    const prestadoresComTicketsExportados = new Set();

    const config = await Sistema.findOne();

    for (const ticket of tickets) {
      const { prestador, servicos } = ticket;

      if (
        prestador.sciUnico &&
        servicos.length > 0 &&
        !prestadoresComTicketsExportados.has(prestador._id) &&
        prestador.status === "ativo"
      ) {
        const valorTotalDoTicket = servicos.reduce((acc, curr) => {
          acc = acc + curr.valor;
          return acc;
        }, 0);

        if (valorTotalDoTicket > 0) {
          documento += criarServicoParaExportacao({
            codAutonomo: prestador.sciUnico,
            codCentroDeCustos: config?.sci?.codigo_centro_custo,
            codEmpresa: config?.sci?.codigo_empresa,
            porcentualIss: config?.sci?.porcentagem_iss,
            dataDePagamento: format(
              addDays(new Date(), config?.sci?.dias_pagamento ?? 0),
              "ddMMyyyy"
            ),
            dataDeRealizacao: format(new Date(), "ddMMyyyy"),
            tipoDeDocumento: 1, // numero do exemplo
            valor: valorTotalDoTicket.toString().replace(".", ","),
          }).concat("\n\n");

          ticket.status = "trabalhando";
          await ticket.save();

          ControleAlteracaoService.registrarAlteracao({
            acao: "alterar",
            dataHora: new Date(),
            idRegistroAlterado: ticket._id,
            origem: "integracao-sci",
            dadosAtualizados: ticket,
            tipoRegistroAlterado: "ticket",
            usuario: req.usuario._id,
          });

          prestadoresComTicketsExportados.add(prestador._id);
        }
      }
    }

    // emailUtils.emailServicosExportados({
    //   documento,
    //   usuario: req.usuario,
    //   servicosExportados: prestadoresComTicketsExportados.length,
    // });
    res.status(200).json({ arquivo: Buffer.from(documento) });
  } catch (error) {
    console.error(error);
    emailUtils.emailGeralDeErro({
      documento: `Ouve um erro ao exportar serviços: ${error}\n\n`,
      usuario: req.usuario,
      tipoDeErro: "exportar serviços",
    });
    res.status(500).json();
  }
};

exports.exportarPrestadores = async (req, res) => {
  try {
    const query = {
      etapa: "geracao-rpa",
      status: { $ne: "concluido" },
    };

    const tickets = await Ticket.find(query).populate("prestador");

    if (!tickets) {
      return res.status(400).json({
        mensagem: "Não foram encontrados tickets para serem exportados ",
      });
    }

    const prestadoresJaExportados = new Set();
    const config = await Sistema.findOne();

    let documento = "";

    for (const { prestador } of tickets) {
      const { sciUnico } = prestador;

      if (!sciUnico && !prestadoresJaExportados.has(prestador._id)) {
        const dataNascimento = prestador.pessoaFisica?.dataNascimento;

        documento += criarPrestadorParaExportacao({
          documento: prestador.documento,
          bairro: prestador.bairro,
          email: prestador.email,
          nome: prestador.nome,
          cep: prestador?.endereco?.cep ?? "",
          nomeMae: "",
          pisNis: prestador?.pessoaFisica?.pis ?? "",
          rg: prestador?.pessoaFisica?.rg?.numero ?? "",
          orgaoEmissorRG: prestador?.pessoaFisica?.rg?.orgaoEmissor ?? "",
          dataNascimento:
            dataNascimento instanceof Date
              ? format(dataNascimento, "dd/MM/yyyy")
              : "",
          CBO: config?.sci?.cbo,
          CFIP: config?.sci?.cfip,
          eSocial: config?.sci?.e_social,
        }).concat("\n\n");

        prestadoresJaExportados.add(prestador._id);
      }
    }

    // emailUtils.emailPrestadoresExportados({
    //   documento,
    //   usuario: req.usuario,
    //   prestadoresExportados: prestadoresJaExportados.size,
    // });
    res.status(200).json({ arquivo: Buffer.from(documento) });
  } catch (error) {
    emailUtils.emailGeralDeErro({
      documento: `Ouve um erro ao exportar prestadores: ${error}\n\n`,
      usuario: req.usuario,
      tipoDeErro: "exportar prestadores",
    });
    res.status(500).json();
  }
};
