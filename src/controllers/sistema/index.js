const Sistema = require("../../models/Sistema");
const BaseOmie = require("../../models/BaseOmie");

const { emailTeste } = require("../../utils/emailUtils");
const CategoriasService = require("../../services/omie/categoriasService");
const ContaCorrenteService = require("../../services/omie/contaCorrenteService");

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
    await emailTeste({ email: req.body.email });
    res.status(200).json();
  } catch (error) {
    console.log("[TESTE EMAIL, ERRO AO ENVIA EMAIL]", error);

    res
      .status(500)
      .json({ mensagem: "Erro enviar email", erro: error.message });
  }
};

exports.listarCategoriasOmie = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const data = await CategoriasService.listarCategorias({ baseOmie });

    return res
      .status(200)
      .json(data?.categoria_cadastro.filter((e) => e.nao_exibir != "S"));
  } catch (error) {
    console.error("Erro ao listar categorias:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.listarContaCorrente = async (req, res) => {
  try {
    const baseOmie = await BaseOmie.findOne();
    const data = await ContaCorrenteService.obterContaAdiamentoCliente({
      baseOmie,
    });

    return res.status(200).json(data?.ListarContasCorrentes);
  } catch (error) {
    console.error("Erro ao listar categorias:", error.message);
    res.status(500).json({ error: error.message });
  }
};
