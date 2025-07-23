const IntegracaoPrestadorOmieCentral = require("../../../models/integracao/prestador/omie-central");
// const PrestadorCentralOmieQueue = require("../../../services/fila/handlers/prestador/central-omie");
const filterOptions = require("../../../utils/filter");

const listarTodas = async (req, res) => {
  try {
    const { time, ...rest } = req.query;
    const umDiaEmMilissegundos = 1000 * 60 * 60 * 24;

    const filtros = {
      arquivado: false,
      updatedAt: { $gte: new Date(Date.now() - time * umDiaEmMilissegundos) },
    };

    const results = await IntegracaoPrestadorOmieCentral.find(filtros).sort({
      executadoEm: -1,
    });

    res.status(200).json(results);
  } catch (error) {
    res.status(500).json("Algo deu errado ao listar integração com prestador");
  }
};

const processar = async (req, res) => {
  try {
    // PrestadorCentralOmieQueue.start();
    return res.status(200).json("Processamento iniciado com sucesso");
  } catch (error) {
    return res
      .status(500)
      .json("Um erro inesperado aconteceu ao processar lista");
  }
};

const arquivar = async (req, res) => {
  try {
    const { id } = req.params;
    const ticketArquivado =
      await IntegracaoPrestadorOmieCentral.findByIdAndUpdate(id, {
        arquivado: true,
        motivoArquivamento: "arquivado pelo usuario",
      });

    res.status(200).json(ticketArquivado);
  } catch (error) {
    return res
      .status(500)
      .json("Um erro inesperado aconteceu ao arquivar item!");
  }
};

const reprocessar = async (req, res) => {
  try {
    const { id } = req.params;

    const integracao = await IntegracaoPrestadorOmieCentral.findById(id);
    if (!integracao) {
      return res.status(404).json("Integração não encontrada");
    }

    const integracaoASerProcessada =
      await IntegracaoPrestadorOmieCentral.findOne({
        prestador: integracao.prestadorId,
        etapa: "requisicao",
        arquivado: false,
      });

    if (integracaoASerProcessada) {
      integracao.arquivado = true;
      integracao.motivoArquivamento = "Duplicidade";
      await integracao.save();
    }

    if (!integracaoASerProcessada) {
      integracao.etapa = "reprocessar";
      integracao.reprocessado = true;
      await integracao.save();
    }

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

const listarComPaginacao = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const filterFromFiltros = filterOptions.queryFiltros({
      filtros: rest,
      schema: IntegracaoPrestadorOmieCentral.schema,
    });

    const searchTermCondition = filterOptions.querySearchTerm({
      searchTerm,
      schema: IntegracaoPrestadorOmieCentral.schema,
      camposBusca: ["prestador.nome", "prestador.documento", "prestador.sid"],
    });

    const queryResult = {
      $and: [filterFromFiltros, { $or: [searchTermCondition] }],
    };

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    const [integracoes, totalIntegracoes] = await Promise.all([
      IntegracaoPrestadorOmieCentral.find(queryResult)
        .skip(skip)
        .limit(limite)
        .sort(sorting),
      IntegracaoPrestadorOmieCentral.countDocuments(queryResult),
    ]);

    res.status(200).json({
      integracoes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalIntegracoes / limite),
        totalItems: totalIntegracoes,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    res.status(500).json("Algo deu errado ao listar integração com prestador");
  }
};

module.exports = {
  processar,
  arquivar,
  reprocessar,
  listarTodas,
  listarComPaginacao,
};
