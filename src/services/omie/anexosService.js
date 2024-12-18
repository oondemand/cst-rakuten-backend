const { compactFile } = require("../../utils/fileHandler");
const apiOmie = require("../../config/apiOmie");

const incluir = async (
  { appKey, appSecret, tabela, nId, nomeArquivo, arquivo, cCodIntAnexo = "" },
  maxTentativas = 3
) => {
  let tentativas = 0;
  let erroEncontrado;
  while (tentativas < maxTentativas) {
    try {
      console.log(
        `[CONTA A PAGAR/ANEXOS]: Incluindo anexo ${nomeArquivo} tentativa ${tentativas + 1}`
      );
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
      tentativas++;
      if (
        error.response?.data?.faultstring?.includes(
          "Consumo redundante detectado"
        )
      ) {
        await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      }

      erroEncontrado =
        error.response?.data?.faultstring ||
        error.response?.data ||
        error.response ||
        error;

      console.log(`Erro ao incluir anexos: ${erroEncontrado}`);
    }
  }
  throw `Erro ao incluir anexo. ${nomeArquivo} após ${maxTentativas} tentativas. ${erroEncontrado}`;
};

const anexoService = { incluir };
module.exports = anexoService;
