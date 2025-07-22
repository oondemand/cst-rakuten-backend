const IntegracaoPrestador = require("../models/IntegracaoPrestador");
const Prestador = require("../models/Prestador");
const { filaPrestador } = require("../services/fila/handlers/prestadorHandler");

exports.listarIntegracaoPrestador = async (req, res) => {
  try {
    const results = await IntegracaoPrestador.find({ arquivado: false }).sort({
      executadoEm: -1,
    });
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json("Algo deu errado ao listar integração com prestador");
  }
};

exports.processarLista = async (req, res) => {
  try {
    filaPrestador.start();
    return res.status(200);
  } catch (error) {
    return res
      .status(500)
      .json("Um erro inesperado aconteceu ao processar lista");
  }
};

exports.arquivar = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketIntegracaoArquivado =
      await IntegracaoPrestador.findByIdAndUpdate(
        id,
        {
          arquivado: true,
          motivoArquivamento: "Solicitado pelo cliente",
        },
        { new: true }
      );

    res.status(200).json(ticketIntegracaoArquivado);
  } catch (error) {
    return res
      .status(500)
      .json("Um erro inesperado aconteceu ao arquivar item!");
  }
};

exports.reprocessar = async (req, res) => {
  try {
    const { id } = req.params;

    const integracao = await IntegracaoPrestador.findById(id);
    if (!integracao) {
      return res.status(404).json("Integração não encontrada");
    }

    // const integracaoASerProcessada = await IntegracaoPrestador.findOne({
    //   prestador: integracao.prestadorId,
    //   etapa: "requisicao",
    //   arquivado: false,
    // });

    // if (integracaoASerProcessada) {
    //   integracaoASerProcessada.arquivado = true;
    //   integracaoASerProcessada.motivoArquivamento = "Duplicidade";
    //   await integracaoASerProcessada.save();
    // }

    // if (!integracaoASerProcessada) {
    integracao.etapa = "reprocessar";
    integracao.reprocessado = true;
    await integracao.save();
    // }

    await Prestador.findByIdAndUpdate(integracao.prestadorId, {
      status_sincronizacao_omie: "processando",
    });

    return res.status(200).json("Integração reprocessada com sucesso!");
  } catch (error) {
    return res
      .status(500)
      .json("Um erro inesperado aconteceu ao reprocessar item!");
  }
};
