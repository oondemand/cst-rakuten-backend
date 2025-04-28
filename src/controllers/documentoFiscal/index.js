const Prestador = require("../../models/Prestador");
const Ticket = require("../../models/Ticket");
const DocumentoFiscal = require("../../models/DocumentoFiscal");

const filtersUtils = require("../../utils/filter");

exports.createDocumentoFiscal = async (req, res) => {
  try {
    const documentoFiscalExistente = await DocumentoFiscal.findOne({
      prestador: req.body.prestador,
      "competencia.mes": req.body.competencia?.mes,
      "competencia.ano": req.body.competencia?.ano,
    });

    if (documentoFiscalExistente) {
      return res.status(400).json({ message: "Documento fiscal existente" });
    }

    const filteredBody = Object.fromEntries(
      Object.entries(req.body).filter(([_, value]) => value !== "")
    );

    const novoDocumentoFiscal = new DocumentoFiscal({
      ...filteredBody,
      status: "aberto",
    });

    await novoDocumentoFiscal.save();

    res.status(201).json({
      message: "Documento fiscal criado com sucesso!",
      documentoFiscal: novoDocumentoFiscal,
    });
  } catch (error) {
    console.error("Erro ao criar documento fiscal:", error);
    res.status(500).json({
      message: "Erro ao criar documento fiscal",
      detalhes: error.message,
    });
  }
};

exports.updateDocumentoFiscal = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const documentoFiscal = await DocumentoFiscal.findById(id);

    if (!documentoFiscal) {
      return res.status(404).json({
        message: "Documento fiscal não encontrado",
      });
    }

    if (["pago", "processando"].includes(documentoFiscal.status)) {
      return res.status(400).json({
        message:
          "Não é possível atualizar um documento fiscal com status pago ou processando.",
      });
    }

    const documentoFiscalAtualizado = await DocumentoFiscal.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      }
    );

    res.status(200).json({
      message: "Documento fiscal atualizado com sucesso!",
      documentoFiscal: documentoFiscalAtualizado,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Erro ao atualizar documento fiscal",
      detalhes: error.message,
    });
  }
};

exports.listarDocumentoFiscal = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const prestadoresQuery = filtersUtils.querySearchTerm({
      searchTerm,
      schema: Prestador.schema,
      camposBusca: ["sid", "documento", "nome"],
    });

    // Busca ids de prestadores com base nas condições criadas de acordo ao search term
    const prestadoresIds = await Prestador.find(prestadoresQuery).select("_id");

    const prestadorConditions =
      prestadoresIds.length > 0
        ? [{ prestador: { $in: prestadoresIds.map((e) => e._id) } }]
        : [];

    // Monta a query para buscar serviços baseados nos demais filtros
    const filterFromFiltros = filtersUtils.queryFiltros({
      filtros: rest,
      schema: DocumentoFiscal.schema,
    });

    // Monta a query para buscar serviços baseados no searchTerm
    const searchTermCondition = filtersUtils.querySearchTerm({
      searchTerm,
      schema: DocumentoFiscal.schema,
      camposBusca: [],
    });

    const queryResult = {
      $and: [
        filterFromFiltros,
        { $or: [searchTermCondition, ...prestadorConditions] },
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

    const [documentosFiscais, totalDedocumentosFiscais] = await Promise.all([
      DocumentoFiscal.find(queryResult)
        .populate("prestador", "sid nome documento tipo")
        .skip(skip)
        .limit(limite)
        .sort(sorting),
      DocumentoFiscal.countDocuments(queryResult),
    ]);

    res.status(200).json({
      documentosFiscais,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDedocumentosFiscais / limite),
        totalItems: totalDedocumentosFiscais,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    // console.log(error);
    res.status(400).json({ error: "Erro ao listar documentos fiscais" });
  }
};

exports.listarDocumentoFiscalPorPrestador = async (req, res) => {
  try {
    const { prestadorId } = req.params;

    const documentosFiscais = await DocumentoFiscal.find({
      prestador: prestadorId,
      statusValidacao: "aprovado",
    }).populate("prestador", "sid nome documento");

    res.status(200).json(documentosFiscais);
  } catch (error) {
    console.error("Erro na listagem:", error);
    res
      .status(400)
      .json({ error: "Falha ao buscar serviços", details: error.message });
  }
};

exports.excluirDocumentoFiscal = async (req, res) => {
  try {
    const documentoFiscalId = req.params.id;

    // await Ticket.updateMany(
    //   { servicos: documentoFiscalId },
    //   { $pull: { servicos: documentoFiscalId } }
    // );

    const documentoFiscal =
      await DocumentoFiscal.findByIdAndDelete(documentoFiscalId);

    if (!documentoFiscal)
      return res.status(404).json({ error: "Documento fiscal não encontrado" });

    res.status(200).json({ data: documentoFiscal });
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir documento fiscal" });
  }
};

// exports.atualizarStatus = async (req, res) => {
//   const { ids, status } = req.body;

//   try {
//     const result = await Servico.updateMany(
//       { _id: { $in: ids } },
//       { $set: { status: status } }
//     );

//     res.status(200).json({
//       message: "Serviço atualizado com sucesso!",
//       servicos: result,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Erro ao atualizar serviço",
//       detalhes: error.message,
//     });
//   }
// };
