const Servico = require("../../models/Servico");
const Prestador = require("../../models/Prestador");
const { buildQuery } = require("../../utils/filter");

exports.listarServicos = async (req, res) => {
  try {
    const {
      ["prestador.sid"]: prestadorSid,
      ["prestador.nome"]: prestadorNome,
      ["prestador.tipo"]: prestadorTipo,
      ["prestador.documento"]: prestadorDocumento,
      status,
      sortBy,
      pageIndex,
      pageSize,
      ...rest
    } = req.query;

    const schema = Servico.schema;
    const prestadorQuery = [];

    if (prestadorSid && prestadorSid !== "")
      prestadorQuery.push({ sid: Number(prestadorSid) });
    if (prestadorTipo && prestadorTipo !== "")
      prestadorQuery.push({ tipo: prestadorTipo });
    if (prestadorNome && prestadorNome !== "")
      prestadorQuery.push({ nome: { $regex: prestadorNome, $options: "i" } });
    if (prestadorDocumento && prestadorDocumento !== "")
      prestadorQuery.push({
        documento: { $regex: prestadorDocumento, $options: "i" },
      });

    const statusFilter =
      status !== ""
        ? { status }
        : { status: { $in: ["pendente", "aberto", "processando"] } };

    const prestadoresIds = await Prestador.find({
      $or: prestadorQuery,
    }).select("_id");

    const filtersQuery = buildQuery({
      filtros: rest,
      schema,
    });

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    const queryResult = {
      $and: [
        filtersQuery,
        statusFilter,
        { $or: [...prestadorConditions] },
        { dataRegistro: { $exists: true } },
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

    const [servicos, totalDeServicos] = await Promise.all([
      Servico.find(queryResult)
        .populate("prestador", "sid nome documento tipo")
        .skip(skip)
        .limit(limite),
      Servico.countDocuments(queryResult),
    ]);

    res.status(200).json({
      servicos,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDeServicos / limite),
        totalItems: totalDeServicos,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: error?.message });
  }
};
