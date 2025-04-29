const Importacao = require("../../models/Importacao");

exports.listarImportacoes = async (req, res) => {
  try {
    const { pageIndex = 0, pageSize = 10, tipo } = req.query;

    const page = parseInt(pageIndex) || 0;
    const limite = parseInt(pageSize) || 10;
    const skip = page * limite;

    if (!["prestador", "servico", "rpa", "documento-fiscal"].includes(tipo)) {
      return res.status(400).json({ message: "Tipo não existente" });
    }

    const [importacoes, totalImportacoes] = await Promise.all([
      Importacao.find({ tipo })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limite),
      Importacao.countDocuments({ tipo }),
    ]);

    res.status(200).json({
      importacoes,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalImportacoes / limite),
        totalItems: totalImportacoes,
        itemsPerPage: limite,
      },
    });
  } catch (error) {
    console.error("Erro ao listar importações:", error);
    res.status(500).json({ mensagem: "Erro interno do servidor" });
  }
};
