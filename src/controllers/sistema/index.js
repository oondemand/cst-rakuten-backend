const Sistema = require("../../models/Sistema");
const { emailTeste } = require("../../utils/emailUtils");

exports.listarSistemaConfig = async (req, res) => {
  try {
    const sistema = await Sistema.findOne();

    if (!sistema) {
      return res
        .status(404)
        .json({ mensagem: "Nenhuma configuração encontrada." });
    }

    res.status(200).json(sistema);
  } catch (error) {
    res
      .status(500)
      .json({ mensagem: "Erro ao buscar configurações", erro: error.message });
  }
};

exports.atualizarSistemaConfig = async (req, res) => {
  const id = req.params.id;

  try {
    const sistemaAtualizado = await Sistema.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!sistemaAtualizado) {
      return res.status(404).json({ mensagem: "Configuração não encontrada." });
    }

    res.status(200).json(sistemaAtualizado);
  } catch (error) {
    res.status(500).json({
      mensagem: "Erro ao atualizar configuração",
      erro: error.message,
    });
  }
};

exports.testeEmail = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    await emailTeste({ email: req.body.email });
    res.status(200).json();
  } catch (error) {
    console.log(error);

    res
      .status(500)
      .json({ mensagem: "Erro enviar email", erro: error.message });
  }
};
