const ControleAlteracao = require("../models/ControleAlteracao");
const filtersUtils = require("../utils/filter");

const listarTodosRegistros = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, tipo, ...rest } =
      req.query;

    const schema = ControleAlteracao.schema;

    const camposBusca = ["status", "nome", "email", "tipo"];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.buildQuery({
      filtros: rest,
      schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema,
      camposBusca,
    });

    const queryResult = {
      $and: [
        filterFromFiltros, // Filtros principais
        {
          $or: [
            searchTermCondition, // Busca textual
          ],
        },
      ],
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

    const [registros, totalRegistros] = await Promise.all([
      ControleAlteracao.find(queryResult)
        .skip(skip)
        .limit(limite)
        .sort({ dataHora: -1 })
        .populate("usuario"),
      ControleAlteracao.countDocuments(queryResult),
    ]);

    res.status(200).json({
      registros,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRegistros / limite),
        totalItems: totalRegistros,
        itemsPerPage: limite,
      },
    });
    // const controleAlteracao = await ControleAlteracao.find()
    //   .sort({ dataHora: -1 })
    //   .populate("usuario");

    // if (controleAlteracao.length === 0) {
    //   return res.status(404).json({ message: "Nenhum registro encontrado!" });
    // }

    // res.status(200).json(controleAlteracao);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar registros",
      error: error.message,
    });
  }
};

module.exports = {
  listarTodosRegistros,
};
