const { compactFile } = require("../../utils/fileHandler");
const apiOmie = require("../../config/apiOmie");

const incluir = async ({
  appKey,
  appSecret,
  tabela,
  nId,
  nomeArquivo,
  arquivo,
  cCodIntAnexo = "",
}) => {
  try {
    const arquivoCompactado = await compactFile(arquivo, nomeArquivo);

    const param = {
      cCodIntAnexo,
      cTabela: tabela,
      nId,
      cNomeArquivo: nomeArquivo,
      cArquivo: arquivoCompactado.base64File,
      cMd5: arquivoCompactado.md5,
    };

    const body = {
      call: "IncluirAnexo",
      app_key: appKey,
      app_secret: appSecret,
      param: [param],
    };

    const response = await apiOmie.post("geral/anexo/", body);
    return response.data;
  } catch (error) {
    console.log("anexoService.incluir: ", error);
    throw "Erro ao incluir anexo: " + error;
  }
};

const anexoService = { incluir };
module.exports = anexoService;
