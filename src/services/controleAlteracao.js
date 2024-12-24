const ControleAlteracao = require("../models/ControleAlteracao");

const registrarAlteracao = async ({
  dataHora,
  usuario,
  tipoRegistroAlterado,
  idRegistroAlterado,
  acao,
  origem,
  dadosAtualizados,
}) => {
  const controleAlteracao = new ControleAlteracao({
    dataHora,
    usuario,
    tipoRegistroAlterado,
    idRegistroAlterado,
    acao,
    origem,
    dadosAtualizados: JSON.stringify(dadosAtualizados),
  });
  await controleAlteracao.save();
};

const ControleAlteracaoService = { registrarAlteracao };

module.exports = { ControleAlteracaoService };
