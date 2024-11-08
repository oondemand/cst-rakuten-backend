const XLSX = require("xlsx");
const fs = require("fs");

const Servico = require("../models/Servico");
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");

const Arquivo = require("../models/Arquivo");
const emailUtils = require("../utils/emailUtils");
const {CNPJouCPF} = require("../utils/formatters")
const { converterNumeroSerieParaData } = require("../utils/dateUtils");
const { format, getMonth, getYear, parse } = require("date-fns");
const { ptBR } = require("date-fns/locale");

exports.importarComissoes = async (req, res) => {

  const mesDeCompetencia = req.query.mes;
  const anoDeCompetencia = req.query.ano;

  if(!mesDeCompetencia || !anoDeCompetencia){
    return res.status(400).json({ message: "Data de competência não enviada." });
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
          periodo: converterNumeroSerieParaData(row[5]) || '',
          valorPrincipal: row[6] || 0,
          valorBonus: row[7] || 0,
          valorAjusteComercial: row[8] || 0,
          valorHospedagemAnuncio: row[9] || 0,
          valorTotal: row[10] || 0,
          nomePrestador: row[20] || '',
          documento: row[19] || ''
        };

        const valorTotalRevisaoDeProvisao = row[15];

        if(valorTotalRevisaoDeProvisao) {
          const revisaoDeProvisao = {
            periodo: converterNumeroSerieParaData(row[11]) || "",
            valorPrincipal: row[12] || 0,
            valorBonus: row[13] || 0,
            valorAjusteComercial: row[14] || 0,
            valorTotal: valorTotalRevisaoDeProvisao,
          }
          data.revisaoDeProvisao = revisaoDeProvisao
        }

        // Adiciona ao resultado apenas se atender aos critérios
        // Detalhe para o tipo "RPA", isso que vai fazer com que 
        // o cabeçalho seja pulado corretamente
        if (data.sid && data.nomePrestador && data.type === "RPA" && getMonth(data.periodo) + 1 == mesDeCompetencia && getYear(data.periodo) == anoDeCompetencia) {
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
        let prestador = await Prestador.findOne({ sid: row.sid });

        if (!prestador) {
          const {numero, tipo} = CNPJouCPF(row.documento);

          prestador = new Prestador({
            sid: row.sid,
            nome: row.nomePrestador,
            status: "em-analise",
            documento: numero,
            tipo,
          });

          await prestador.save();
          detalhes.totalDeNovosPrestadores += 1;
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

        if(!ticket){
         ticket = new Ticket({
            prestador: prestador._id,
            titulo: `Comissão ${prestador.nome}: ${getMonth(row.periodo) + 1}/${getYear(row.periodo)}`,
            status: "aguardando-inicio",
            etapa: "requisicao",
          });

          await ticket.save()
          detalhes.totalDeNovosTickets += 1
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

        if(row.revisaoDeProvisao){
          const servicoDeCorrecao = new Servico({
            prestador: prestador._id,
            mesCompetencia: getMonth(row.revisaoDeProvisao.periodo) + 1, // Meses no date-fns começam a partir do 0
            anoCompetencia: getYear(row.revisaoDeProvisao.periodo),
            valorPrincipal: row.revisaoDeProvisao.valorPrincipal,
            valorBonus: row.revisaoDeProvisao.valorBonus,
            valorAjusteComercial: row.revisaoDeProvisao.valorAjusteComercial,
            valorHospedagemAnuncio: row.revisaoDeProvisao.valorHospedagemAnuncio,
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
  } catch (error) {
    console.error("Erro ao importar comissões:", error);
  }
};

exports.exportarServicos = async (req, res) => {
  console.log("Exportar serviços");
  res.send("Exportar serviços");
};

exports.exportarPrestadores = async (req, res) => {
  console.log("Exportar prestadores");
  res.send("Exportar prestadores");
};

exports.importarPrestadores = async (req, res) => {
  console.log("Importar prestadores");
  res.send("Importar prestadores");
};

exports.importarRPAs = async (req, res) => {
  console.log("Importar RPA");
  res.send("Importar RPA");
};
