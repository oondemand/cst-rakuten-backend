const BaseOmie = require("../models/BaseOmie");

exports.registrarBaseOmie = async (req, res) => {
  const { nome, cnpj, appKey, appSecret, status } = req.body;

  try {
    // Cria a nova Base Omie
    const baseOmie = new BaseOmie({
      nome,
      cnpj,
      appKey,
      appSecret,
      status,
    });

    await baseOmie.save();

    // Popula os campos necessários (se houver referências)
    const baseOmiePopulada = await BaseOmie.findById(baseOmie._id);

    res.status(201).json({
      message: "Base Omie registrada com sucesso!",
      baseOmie: baseOmiePopulada,
    });
  } catch (error) {
    console.error("Erro ao registrar Base Omie:", error);
    res.status(500).json({
      message: "Erro ao registrar Base Omie",
      detalhes: error.message,
    });
  }
};

exports.listarBaseOmies = async (req, res) => {
  try {
    const baseOmies = await BaseOmie.find();
    res.json(baseOmies);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar baseOmies" });
  }
};

exports.obterBaseOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findById(req.params.id);
    if (!baseOmie)
      return res.status(404).json({ error: "BaseOmie não encontrada" });
    res.json(baseOmie);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter baseOmie" });
  }
};

exports.atualizarBaseOmie = async (req, res) => {
  const { nome, cnpj, appKey, appSecret, status } = req.body;

  try {
    // Atualiza a Base Omie
    const baseOmie = await BaseOmie.findByIdAndUpdate(
      req.params.id,
      { nome, cnpj, appKey, appSecret, status },
      { new: true, runValidators: true },
    );

    if (!baseOmie) {
      return res.status(404).json({ message: "Base Omie não encontrada" });
    }

    // Popula os campos necessários (se houver referências)
    const baseOmiePopulada = await BaseOmie.findById(baseOmie._id);

    res.status(200).json({
      message: "Base Omie atualizada com sucesso!",
      baseOmie: baseOmiePopulada,
    });
  } catch (error) {
    console.error("Erro ao atualizar Base Omie:", error);
    res.status(500).json({
      message: "Erro ao atualizar Base Omie",
      detalhes: error.message,
    });
  }
};

exports.excluirBaseOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findByIdAndDelete(req.params.id);
    if (!baseOmie)
      return res.status(404).json({ error: "BaseOmie não encontrada" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir baseOmie" });
  }
};
