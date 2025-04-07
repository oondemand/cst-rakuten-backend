const ControleAlteracao = require("../models/ControleAlteracao");
const Usuario = require("../models/Usuario");

const filtersUtils = require("../utils/filter");

const listarTodosRegistros = async (req, res) => {
  try {
    const {
      sortBy,
      pageIndex,
      pageSize,
      searchTerm = "",
      tipo,
      ["usuario.nome"]: usuarioNome,
      ...rest
    } = req.query;

    console.log(rest, usuarioNome, searchTerm);

    const usuarioFiltersQuery = filtersUtils.queryFiltros({
      filtros: { nome: usuarioNome },
      schema: Usuario.schema,
    });

    const usuarioQuerySearchTerm = filtersUtils.querySearchTerm({
      schema: Usuario.schema,
      searchTerm,
      camposBusca: ["nome"],
    });

    const usuariosIds = await Usuario.find({
      $and: [usuarioFiltersQuery, { $or: [usuarioQuerySearchTerm] }],
    }).select("_id");

    const usuariosConditions =
      usuariosIds.length > 0
        ? [{ usuario: { $in: usuariosIds.map((e) => e._id) } }]
        : [];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema: ControleAlteracao.schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: ControleAlteracao.schema,
      camposBusca: ["status", "dataHora"],
    });

    const queryResult = {
      $and: [
        filterFromFiltros,
        {
          $or: [
            ...(searchTerm !== "" && Object.keys(searchTermCondition).length > 0
              ? searchTermCondition
              : []),
            ...usuariosConditions,
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
