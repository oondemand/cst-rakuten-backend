const XLSX = require("xlsx");

const processarData = async (data) => {
  console.log("Importar comissão");

  try {
    const workbook = XLSX.read(data, { type: "array" });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    // Processar os dados pela posição das colunas
    const processedData = jsonData.map((row) => {
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
        correcao: row[9] !== undefined ? row[9] : false,
      };
    });

    // Percorrer os dados e salvar no banco
    processedData.forEach((row) => {
      if (row.sid && row.nomePrestador) {
        // Adicione outras verificações conforme necessário
        console.log("Salvando comissão:", row);
        // Adicione a lógica para salvar no banco de dados aqui
      } else {
        console.log("Linha inválida:", row);
      }
    });

    // console.log("Dados importados:", processedData);
  } catch (error) {
    console.error("Erro ao processar dados:", error);
  }
};

module.exports = {
  processarData,
};
