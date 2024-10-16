const XLSX = require("xlsx");
const fs = require("fs");

const Servico = require("../models/Servico");
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");

exports.importarComissoes = async (req, res) => {
  try {
    const arquivo = req.file;

    if (!arquivo) {
      return res.status(400).json({ message: "Nenhum arquivo enviado." });
    }

    // Ler o arquivo usando XLSX
    const workbook = XLSX.readFile(arquivo.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    // Processar os dados pela posição das colunas
    const processedData = jsonData
      .map((row, index) => {
        if (index === 0) return null; // Ignorar cabeçalho, se existir

        return {
          sid: row[0] !== undefined ? row[0] : "",
          nomePrestador: row[1] !== undefined ? row[1] : "",
          mesCompetencia: row[2] !== undefined ? row[2] : "",
          anoCompetencia: row[3] !== undefined ? row[3] : "",
          valorPrincipal: row[4] !== undefined ? row[4] : 0,
          valorBonus: row[5] !== undefined ? row[5] : 0,
          valorAjusteComercial: row[6] !== undefined ? row[6] : 0,
          valorHospedagemAnuncio: row[7] !== undefined ? row[7] : 0,
          valorTotal: row[8] !== undefined ? row[8] : 0,
        };
      })
      .filter((row) => row !== null); // Remove linhas nulas

    // Percorrer os dados e salvar no banco
    for (const row of processedData) {
      if (row.sid && row.nomePrestador) {
        //pesquisar prestador pelo sid; se não existir, criar um novo
        let prestador = await Prestador.findOne({ sid: row.sid });
        if (!prestador) {
          const novoPrestador = new Prestador({
            sid: row.sid,
            nome: row.nomePrestador,
            status: "pendente-de-revisao",
          });
          prestador = await novoPrestador.save();
        }

        const novoServico = new Servico({
          prestador: prestador._id,
          mesCompetencia: row.mesCompetencia,
          anoCompetencia: row.anoCompetencia,
          valorPrincipal: row.valorPrincipal,
          valorBonus: row.valorBonus,
          valorAjusteComercial: row.valorAjusteComercial,
          valorHospedagemAnuncio: row.valorHospedagemAnuncio,
          valorTotal: row.valorTotal,
          correcao: row.correcao,
          status: "ativo", // Ou outro valor padrão
        });

        const servico = await novoServico.save();

        // cria um novo ticket para o servico e prestador
        const novoTicket = new Ticket({
          servico: servico._id,
          prestador: prestador._id,
          titulo: `Comissão ${prestador.nome}: ${servico.mesCompetencia}/${servico.anoCompetencia}`,
          status: "aguardando-inicio",
          etapa: "requisicao",
        });

        await novoTicket.save();

        console.log("ticket criado:", novoTicket.titulo);
      } else {
        console.log("Linha inválida:", row);
        // Opcional: registrar ou retornar informações sobre linhas inválidas
      }
    }

    // Remover o arquivo após o processamento
    fs.unlinkSync(arquivo.path);

    res.status(201).json({ message: "Comissões importadas com sucesso." });
  } catch (error) {
    console.error("Erro ao importar comissões:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
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
