const IntegracaoPrestador = require("../models/IntegracaoPrestador");
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
