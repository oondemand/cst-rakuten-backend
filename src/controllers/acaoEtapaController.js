const XLSX = require("xlsx");
const fs = require("fs");

const Servico = require("../models/Servico");
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");
const Arquivo = require("../models/Arquivo");
const BaseOmie = require("../models/BaseOmie");

const { max, addDays, format, getMonth, getYear } = require("date-fns");

const {
  criarPrestadorParaExportacao,
} = require("../services/integracaoRPAs/exportarPrestadores");

const {
  criarServicoParaExportacao,
} = require("../services/integracaoRPAs/exportarServicos");

const emailUtils = require("../utils/emailUtils");
const { CNPJouCPF } = require("../utils/formatters");
const { converterNumeroSerieParaData } = require("../utils/dateUtils");

const { criarNomePersonalizado } = require("../utils/formatters");

const clienteService = require("../services/omie/clienteService");
const Usuario = require("../models/Usuario");

const buscarPrestadorOmie = async ({ documento }) => {
  try {
    const baseOmie = await BaseOmie.findOne({ status: "ativo" });

    const {
      cep,
      cidade,
      cnpj_cpf,
      complemento,
      endereco,
      email,
      endereco_numero,
      estado,
      pessoa_fisica,
      razao_social,
      dadosBancarios,
    } = await clienteService.pesquisarPorCNPJ(
      baseOmie.appKey,
      baseOmie.appSecret,
      documento
    );

    const { agencia, codigo_banco, conta_corrente } = dadosBancarios;

    const prestadorOmie = {
      nome: razao_social,
      tipo: pessoa_fisica === "S" ? "pf" : "pj",
      documento: cnpj_cpf.replaceAll(".", "").replaceAll("-", ""),
      dadosBancarios: {
        agencia: agencia,
        conta: conta_corrente,
      },
      email: email,
      endereco: {
        cep: cep,
        rua: endereco,
        numero: endereco_numero,
        complemento: complemento,
        cidade: cidade,
        estado: estado,
      },
      pessoaFisica: {
        rg: {
          numero:
            pessoa_fisica === "S" &&
            cnpj_cpf.replaceAll(".", "").replaceAll("-", ""),
        },
      },
      pessoaJuridica: {
        razaoSocial: pessoa_fisica !== "S" && razao_social,
        nomeFantasia: pessoa_fisica !== "S" && razao_social,
      },
    };

    return prestadorOmie;
  } catch (error) {
    if (error.includes("Não existem registros para a página")) {
      console.log("Esperando 1 minuto");
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    }
    return;
  }
};

exports.importarComissoes = async (req, res) => {
  const mesDeCompetencia = req.query.mes;
  const anoDeCompetencia = req.query.ano;

  if (!mesDeCompetencia || !anoDeCompetencia) {
    return res
      .status(400)
      .json({ message: "Data de competência não enviada." });
  }

  const arquivo = req.file;

  if (!arquivo) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }

  res.status(200).json({ message: "Arquivo recebido e sendo processado" });

  try {
    console.log("[PROCESSANDO ARQUIVO...]");

    // Ler o arquivo usando XLSX
    const workbook = XLSX.readFile(arquivo.path);
    const sheetName = workbook.SheetNames[1];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    // Processar os dados pela posição das colunas
    const processedData = jsonData.reduce((result, row, i) => {
      const data = {
        type: row[0],
        sid: row[3],
        periodo: converterNumeroSerieParaData(row[5]) || "",
        valorPrincipal: row[6] || 0,
        valorBonus: row[7] || 0,
        valorAjusteComercial: row[8] || 0,
        valorHospedagemAnuncio: row[9] || 0,
        valorTotal: row[10] || 0,
        nomePrestador: row[20] || "",
        documento: row[19] || "",
      };

      const valorTotalRevisaoDeProvisao = row[15];

      if (valorTotalRevisaoDeProvisao) {
        const revisaoDeProvisao = {
          periodo: converterNumeroSerieParaData(row[11]) || "",
          valorPrincipal: row[12] || 0,
          valorBonus: row[13] || 0,
          valorAjusteComercial: row[14] || 0,
          valorTotal: valorTotalRevisaoDeProvisao,
        };
        data.revisaoDeProvisao = revisaoDeProvisao;
      }

      // Adiciona ao resultado apenas se atender aos critérios
      // Detalhe para o tipo "RPA", isso que vai fazer com que
      // o cabeçalho seja pulado corretamente
      if (
        data.sid &&
        data.nomePrestador &&
        data.type === "RPA" &&
        getMonth(data.periodo) + 1 == mesDeCompetencia &&
        getYear(data.periodo) == anoDeCompetencia
      ) {
        result.push(data);
      }

      return result;
    }, []);

    let detalhes = {
      competenciaProscessada: `${mesDeCompetencia}/${anoDeCompetencia}`,
      linhasEncontradas: processedData.length,
      linhasLidasComErro: 0,
      totalDeNovosPrestadores: 0,
      valorTotalLido: 0,
      totalDeNovosTickets: 0,
      erros: null,
    };

    // Percorrer os dados e salvar no banco
    for (const row of processedData) {
      try {
        const { numero, tipo } = CNPJouCPF(row.documento);

        let prestador = await Prestador.findOne({ sid: row.sid });

        if (!prestador) {
          const prestadorOmie = await buscarPrestadorOmie({
            documento: numero,
          });

          if (prestadorOmie) {
            prestador = new Prestador({
              ...prestadorOmie,
              sid: row.sid,
              nome: row.nomePrestador,
              status: "em-analise",
            });
            await prestador.save();
            detalhes.totalDeNovosPrestadores += 1;

            console.log("Criando prestador via omie");
          }

          if (!prestadorOmie) {
            prestador = new Prestador({
              sid: row.sid,
              nome: row.nomePrestador,
              status: "em-analise",
              documento: numero,
              tipo,
            });

            await prestador.save();
            detalhes.totalDeNovosPrestadores += 1;
            console.log("Criando prestador via planilha");
          }

          if (prestador.email) {
            let usuario = await Usuario.findOne({ email: prestador.email });

            if (!usuario) {
              usuario = new Usuario({
                email: prestador.email,
                nome: prestador.nome,
                tipo: "prestador",
                senha: "123456",
              });

              await usuario.save();
            }

            prestador.usuario = usuario._id;
            await prestador.save();

            const token = usuario.gerarToken();

            const url = new URL(
              "/first-login",
              process.env.BASE_URL_APP_PUBLISHER
            );
            url.searchParams.append("code", token);

            //mostra url para não ter que verificar no email
            console.log("URL", url.toString());

            await emailUtils.emailLinkCadastroUsuarioPrestador({
              email: req.usuario.email,
              nome: prestador.nome,
              url: url.toString(),
            });
          }
        }

        let ticket = await Ticket.findOne({
          prestador,
          etapa: {
            $in: [
              "requisicao",
              "verificacao",
              "aprovacao-tributaria",
              "aprovacao-cadastro",
            ],
          },
        });

        if (!ticket) {
          ticket = new Ticket({
            prestador: prestador._id,
            titulo: `Comissão ${prestador.nome}: ${getMonth(row.periodo) + 1}/${getYear(row.periodo)}`,
            status: "aguardando-inicio",
            etapa: "requisicao",
          });

          await ticket.save();
          detalhes.totalDeNovosTickets += 1;
        }

        const servico = new Servico({
          prestador: prestador._id,
          mesCompetencia: getMonth(row.periodo) + 1, // Meses no date-fns começam a partir do 0
          anoCompetencia: getYear(row.periodo),
          valorPrincipal: row.valorPrincipal,
          valorBonus: row.valorBonus,
          valorAjusteComercial: row.valorAjusteComercial,
          valorHospedagemAnuncio: row.valorHospedagemAnuncio,
          valorTotal: row.valorTotal,
          status: "ativo",
        });

        await servico.save();
        detalhes.valorTotalLido += row.valorTotal;

        ticket.servicos.push(servico._id);
        await ticket.save();

        if (row.revisaoDeProvisao) {
          const servicoDeCorrecao = new Servico({
            prestador: prestador._id,
            mesCompetencia: getMonth(row.revisaoDeProvisao.periodo) + 1, // Meses no date-fns começam a partir do 0
            anoCompetencia: getYear(row.revisaoDeProvisao.periodo),
            valorPrincipal: row.revisaoDeProvisao.valorPrincipal,
            valorBonus: row.revisaoDeProvisao.valorBonus,
            valorAjusteComercial: row.revisaoDeProvisao.valorAjusteComercial,
            valorHospedagemAnuncio:
              row.revisaoDeProvisao.valorHospedagemAnuncio,
            valorTotal: row.revisaoDeProvisao.valorTotal,
            correcao: true,
            status: "ativo",
          });
          await servicoDeCorrecao.save();
          detalhes.valorTotalLido += row.revisaoDeProvisao.valorTotal;

          ticket.servicos.push(servicoDeCorrecao._id);
          await ticket.save();
        }
      } catch (err) {
        detalhes.linhasLidasComErro += 1;
        detalhes.erros += `Erro ao processar linha: ${JSON.stringify(row)} - ${err} \n\n`;

        console.error(
          `Erro ao processar linha: ${JSON.stringify(row)} - ${err}`
        );
      }
    }

    await emailUtils.importarComissõesDetalhes({
      detalhes,
      usuario: req.usuario,
    });

    // Remover o arquivo após o processamento
    fs.unlinkSync(arquivo.path);
  } catch (error) {
    console.error("Erro ao importar comissões:", error);
  }
};

exports.exportarServicos = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      etapa: "integracao-unico",
      status: { $ne: "concluido" },
    })
      .populate("servicos")
      .populate("prestador");

    if (!tickets) {
      return res.status(400).json({
        mensagem: "Não foram encontrados tickets a serem exportados",
      });
    }

    res
      .status(200)
      .json({ mensagem: "Serviços sendo processados e exportados" });

    let documento = "";
    const prestadoresComTicketsExportados = [];

    for (const ticket of tickets) {
      const { prestador, servicos } = ticket;
      if (
        prestador.sciUnico &&
        servicos.length > 0 &&
        !prestadoresComTicketsExportados.includes(prestador._id) &&
        prestador.status === "ativo"
      ) {
        let valorTotalDoTicket = 0;

        for (const { valorTotal } of servicos) {
          valorTotalDoTicket += valorTotal;
        }

        if (valorTotalDoTicket > 0) {
          documento += criarServicoParaExportacao({
            codAutonomo: prestador.sciUnico,
            codCentroDeCustos: process.env.SCI_CODIGO_CENTRO_CUSTO,
            codEmpresa: process.env.SCI_CODIGO_EMPRESA,
            porcentualIss: process.env.SCI_PORCENTAGEM_ISS,
            dataDePagamento: format(
              addDays(new Date(), Number(process.env.SCI_DIAS_PAGAMENTO)),
              "ddMMyyyy"
            ),
            dataDeRealizacao: format(new Date(), "ddMMyyyy"),
            tipoDeDocumento: 1, // numero do exemplo
            valor: valorTotalDoTicket.toString().replace(".", ","),
          }).concat("\n\n");

          ticket.status = "trabalhando";
          await ticket.save();

          prestadoresComTicketsExportados.push(prestador._id);
        }
      }
    }

    emailUtils.emailServicosExportados({
      documento,
      usuario: req.usuario,
      servicosExportados: prestadoresComTicketsExportados.length,
    });
  } catch (error) {
    console.error(error);
    emailUtils.emailGeralDeErro({
      documento: `Ouve um erro ao exportar serviços: ${error}\n\n`,
      usuario: req.usuario,
      tipoDeErro: "exportar serviços",
    });
  }
};

exports.exportarPrestadores = async (req, res) => {
  try {
    const tickets = await Ticket.find({
      etapa: "integracao-unico",
      status: { $ne: "concluido" },
    }).populate("prestador");

    if (!tickets) {
      return res.status(400).json({
        mensagem: "Não foram encontrados tickets para serem exportados ",
      });
    }

    res
      .status(200)
      .json({ mensagem: "Prestadores sendo processados e exportados" });

    const prestadoresExportados = [];
    let documento = "";

    for (const { prestador } of tickets) {
      if (
        !prestador.sciUnico &&
        !prestadoresExportados.includes(prestador._id)
      ) {
        const dataNascimento = prestador.pessoaFisica?.dataNascimento;

        documento += criarPrestadorParaExportacao({
          documento: prestador.documento,
          bairro: prestador.bairro,
          email: prestador.email,
          nome: prestador.nome,
          cep: prestador.endereco ? prestador.endereco.cep : "",
          nomeMae: prestador.pessoaFisica ? prestador.pessoaFisica.nomeMae : "",
          pisNis: prestador.pessoaFisica ? prestador.pessoaFisica.pis : "",
          rg: prestador.pessoaFisica ? prestador.pessoaFisica.rg.numero : "",
          orgaoEmissorRG: prestador.pessoaFisica
            ? prestador.pessoaFisica.rg.orgaoEmissor
            : "",
          dataNascimento:
            dataNascimento instanceof Date
              ? format(dataNascimento, "dd/MM/yyyy")
              : "",
          CBO: process.env.SCI_CBO,
          CFIP: process.env.SCI_CFIP,
          eSocial: process.env.SCI_ESOCIAL,
        }).concat("\n\n");

        prestador.status = "aguardando-codigo-sci";
        prestador.dataExportacao = new Date();
        await prestador.save();
        prestadoresExportados.push(prestador._id);
      }
    }

    emailUtils.emailPrestadoresExportados({
      documento,
      usuario: req.usuario,
      prestadoresExportados: prestadoresExportados.length,
    });
  } catch (error) {
    console.error(error);
    emailUtils.emailGeralDeErro({
      documento: `Ouve um erro ao exportar prestadores: ${error}\n\n`,
      usuario: req.usuario,
      tipoDeErro: "exportar prestadores",
    });
  }
};

exports.importarPrestadores = async (req, res) => {
  console.log("Importar prestadores");
  res.send("Importar prestadores");
};

exports.importarRPAs = async (req, res) => {
  const arquivos = req.files;

  if (arquivos === 0) {
    return res.status(400).json({ message: "Nenhum arquivo enviado." });
  }

  res.status(200).json({ message: "Arquivos recebidos e sendo processados!" });

  const anexarArquivoAoTicket = async (arquivo) => {
    const detalhes = {};
    const sciUnico = arquivo.originalname.replace(".pdf", "").split("_")[2];

    if (!sciUnico || isNaN(sciUnico)) {
      throw `Erro ao fazer upload de arquivo ${arquivo.originalname}; sciUnico não encontrado no nome do arquivo ou não é um número válido`;
    }

    const prestador = await Prestador.findOne({ sciUnico: sciUnico });

    if (!prestador) {
      throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um prestador com sciUnico: ${sciUnico}`;
    }

    const ticket = await Ticket.findOne({
      etapa: "integracao-unico",
      prestador,
      status: "trabalhando",
    });

    if (!ticket) {
      throw `Erro ao fazer upload de arquivo ${arquivo.originalname} - Não foi encontrado um ticket aberto e com status trabalhando referente ao prestador ${prestador.name} - sciUnico: ${prestador.sciUnico}`;
    }

    const novoArquivoDoTicket = new Arquivo({
      nome: criarNomePersonalizado({ nomeOriginal: arquivo.originalname }),
      nomeOriginal: arquivo.originalname,
      path: arquivo.path,
      mimetype: arquivo.mimetype,
      size: arquivo.size,
      ticket: ticket._id,
      buffer: arquivo.buffer,
    });
    await novoArquivoDoTicket.save();

    ticket.arquivos.push(novoArquivoDoTicket._id);

    ticket.etapa = "aprovacao-pagamento";
    ticket.status = "aguardando-inicio";

    await ticket.save();

    return ticket;
  };

  try {
    let detalhes = {
      erros: { quantidade: 0, logs: "" },
      sucesso: 0,
    };

    for (const arquivo of arquivos) {
      try {
        const ticket = await anexarArquivoAoTicket(arquivo);
        if (ticket) {
          detalhes.sucesso += 1;
        }
      } catch (error) {
        detalhes.erros.quantidade += 1;
        detalhes.erros.logs += JSON.stringify(error).concat("\n\n");
        console.error(error);
      }
    }

    await emailUtils.emailImportarRpas({ detalhes, usuario: req.usuario });
  } catch (error) {
    console.error(error);
  }
};
