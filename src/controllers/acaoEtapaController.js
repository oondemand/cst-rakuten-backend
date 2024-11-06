const XLSX = require("xlsx");
const fs = require("fs");

const Servico = require("../models/Servico");
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");
const Arquivo = require("../models/Arquivo");

const emailUtils = require("../utils/emailUtils");

const mongoose = require("mongoose");

const {
  criarPrestadorParaExportacao,
} = require("../services/integracaoRPAs/exportarPrestadores");
const {
  criarServicoParaExportacao,
} = require("../services/integracaoRPAs/exportarServicos");

const { converterNumeroSerieParaData } = require("../utils/dateUtils");

const { format, getMonth, getYear } = require("date-fns");
const { ptBR } = require("date-fns/locale");

const verificarDuplicidadeDeTicketsNaEtapaDeIntegração = async (baseOmieId) => {
  return await Ticket.aggregate([
    {
      $match: {
        // baseOmie: baseOmieId,
        etapa: "integracao-unico",
      },
    },
    {
      $group: {
        _id: "$prestador", // Agrupando pelo campo 'prestador'
        count: { $sum: 1 }, // Contando tickets para cada 'prestador'
      },
    },
    {
      $match: {
        count: { $gt: 1 }, // Filtra apenas prestadores com mais de um ticket
      },
    },
    {
      $limit: 1, // Limita o resultado a um registro para verificar apenas a existência
    },
  ]);
};

exports.importarComissoes = async (req, res) => {
  console.log("[PROCESSANDO COMISSÕES]...");

  try {
    const arquivo = req.file;

    if (!arquivo) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    // Ler o arquivo usando XLSX
    const workbook = XLSX.readFile(arquivo.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    });

    // Processar os dados pela posição das colunas
    const processedData = jsonData
      .map((row, index) => {
        if (index <= 5) return null; // Ignorar cabeçalho, (equivalente ao modelo de exemplo )

        return {
          sid: row[3] || "",
          nomePrestador: row[2] || "",
          mesCompetencia: row[5] || "",
          anoCompetencia: row[5] || "",
          valorPrincipal: row[6] || 0,
          valorBonus: row[7] || 0,
          valorAjusteComercial: row[8] || 0,
          valorHospedagemAnuncio: row[9] || 0,
          valorTotal: row[10] || 0,
        };
      })
      .filter((row) => row !== null && row.sid && row.nomePrestador); // Filtra linhas inválidas

    let detalhes = {
      linhasEncontradas: processedData.length,
      linhasLidasComErro: 0,
      totalDeNovosPrestadores: 0,
      valorTotalLido: 0,
      totalDeNovosTickets: 0,
      erros: "",
    };

    // Percorrer os dados e salvar no banco
    for (const row of processedData) {
      try {
        let prestador = await Prestador.findOne({ sid: row.sid });

        if (!prestador) {
          prestador = new Prestador({
            sid: row.sid,
            nome: row.nomePrestador,
            status: "pendente-de-revisao",
          });
          await prestador.save();
          detalhes.totalDeNovosPrestadores += 1;
        }
        
        const servico = new Servico({
          prestador: prestador._id,
          mesCompetencia:
            getMonth(converterNumeroSerieParaData(row.mesCompetencia)) + 1, // Meses no date-fns começam a partir do 0
          anoCompetencia: getYear(
            converterNumeroSerieParaData(row.anoCompetencia),
          ),
          valorPrincipal: row.valorPrincipal,
          valorBonus: row.valorBonus,
          valorAjusteComercial: row.valorAjusteComercial,
          valorHospedagemAnuncio: row.valorHospedagemAnuncio,
          valorTotal: row.valorTotal,
          correcao: row.correcao || false,
          status: "ativo",
        });

        await servico.save();

        const ticket = await Ticket.findOne({
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

        if (ticket) {
          ticket.servicos.push(servico._id);
          await ticket.save();
        }

        if (!ticket) {
          const novoTicket = new Ticket({
            servicos: [servico._id],
            prestador: prestador._id,
            titulo: `Comissão ${prestador.nome}: ${servico.mesCompetencia}/${servico.anoCompetencia}`,
            status: "aguardando-inicio",
            etapa: "requisicao",
          });
          await novoTicket.save();
          detalhes.totalDeNovosTickets += 1;
        }

        detalhes.valorTotalLido += row.valorTotal;
      } catch (err) {
        detalhes.linhasLidasComErro += 1;
        detalhes.erros += `Erro ao processar linha: ${JSON.stringify(row)} - ${err} \n\n`;
        
        console.error(
          `Erro ao processar linha: ${JSON.stringify(row)} - ${err}`,
        );
      }
    }

    await emailUtils.importarComissõesDetalhes({
      detalhes,
      usuario: req.usuario,
    });

    // Remover o arquivo após o processamento
    fs.unlinkSync(arquivo.path);

    res.status(200).json({
      message: "Comissões importadas. Verifique o relatório em seu email!",
    });
  } catch (error) {
    console.error("Erro ao importar comissões:", error);
    res
      .status(500)
      .json({ message: "Erro interno do servidor.", detalhes: error.message });
  }
};

exports.exportarServicos = async (req, res) => {
  try {
    const ticketsComMesmoPrestador =
      await verificarDuplicidadeDeTicketsNaEtapaDeIntegração();

    if (ticketsComMesmoPrestador.length > 0) {
      return res.status(409).json({ message: "Erro ao exportar serviços" });
    }

    const tickets = await Ticket.find({
      etapa: "integracao-unico",
      status: { $ne: "concluido" },
    })
      .populate("servicos")
      .populate("prestador");

    let txt = "";

    for (const ticket of tickets) {
      for (const servico of ticket.servicos) {
        txt += criarServicoParaExportacao({
          codEmpresa: 101009,
          codAutonomo: ticket.prestador.sciUnico,
          tipoDeDocumento: 2,
          dataDeRealizacao: format(servico.createdAt, "ddMMyyyy", {
            locale: ptBR,
          }),
          valor: servico.valorTotal,
          codCentroDeCustos: 17,
        }).concat("\n\n");
      }

      ticket.status = "trabalhando";
      ticket.save();
    }

    res.setHeader("Content-Disposition", "attachment; filename=servicos.txt");
    res.setHeader("Content-Type", "text/plain");

    return res.send(txt);
  } catch (error) {
    res.status(500).json({ message: "Erro ao exportar serviços" });
  }
};

exports.exportarPrestadores = async (req, res) => {
  try {
    const ticketsComMesmoPrestador =
      await verificarDuplicidadeDeTicketsNaEtapaDeIntegração();

    if (ticketsComMesmoPrestador.length > 0) {
      return res.status(409).json({ message: "Erro ao exportar prestadores" });
    }

    const tickets = await Ticket.find({
      etapa: "integracao-unico",
      status: { $ne: "concluido" },
    });

    let prestadoresTxt = "";

    for (const ticket of tickets) {
      const prestador = await Prestador.findById(ticket.prestador);

      if (!prestador.sciUnico) {
        const ultimoPrestador = await Prestador.findOne()
          .sort({ sciUnico: -1 })
          .exec();
        const novoSciUnico = ultimoPrestador.sciUnico
          ? ultimoPrestador.sciUnico + 1
          : 60000;

        prestador.sciUnico = novoSciUnico;
        prestador.save();
      }
      

      prestadoresTxt += criarPrestadorParaExportacao({
        codSCI: prestador.sciUnico,
        documento: prestador.documento,
        bairro: prestador.bairro,
        email: prestador.email,
        nome: prestador.nome,
        cep: prestador.endereco ? prestador.endereco.cep : "",
      }).concat("\n\n");
    }

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=prestadores.txt",
    );
    res.setHeader("Content-Type", "text/plain");

    return res.send(prestadoresTxt);
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Erro ao exportar prestadores" });
  }
};

exports.importarPrestadores = async (req, res) => {
  console.log("Importar prestadores");
  res.send("Importar prestadores");
};

exports.importarRPAs = async (req, res) => {
  try {
    if (!req.file || req.file.length === 0) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    const sciUnico = req.file.originalname.replace(".pdf", "").split("-")[2];

    const prestador = await Prestador.find({ sciUnico: sciUnico });

    const ticket = await Ticket.findOne({
      etapa: "integracao-unico",
      prestador,
    });

    const arquivo = new Arquivo({
      nome: req.file.filename,
      nomeOriginal: req.file.originalname,
      path: req.file.path,
      mimetype: req.file.mimetype,
      size: req.file.size,
      ticket: ticket._id,
    });

    await arquivo.save();

    ticket.arquivos.push(arquivo._id);

    ticket.etapa = "aprovacao-pagamento";
    ticket.status = "aguardando-inicio";

    await ticket.save();

    res.status(201).json({ message: "batendo aqui" });
  } catch (error) {
    console.error("Erro ao fazer upload de arquivos:", error);
    res.status(500).json({
      message: "Erro ao fazer upload de arquivos.",
      detalhes: error.message,
    });
  }
};
