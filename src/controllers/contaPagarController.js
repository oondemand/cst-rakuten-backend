const Ticket = require("../models/Ticket");
const Empresa = require("../models/Empresa");
const { consultar } = require("../services/omie/contaPagarService");

const obterContaPagarOmie = async (req, res) => {
  try {
    const { codigoLancamento } = req.params;

    // Buscar o ticket pelo codigoLancamento no campo contaPagarOmie
    const ticket = await Ticket.findOne({ contaPagarOmie: codigoLancamento }).populate("nfse");
    if (!ticket) {
      return res.status(404).json({ mensagem: "Ticket com a conta a pagar não encontrado." });
    }

    const cnpjTomador = ticket.nfse.infoNfse.tomador.documento.replace(/[^\d]/g, "");

    // Buscar a empresa no banco de dados pelo CNPJ
    const empresa = await Empresa.findOne({ cnpj: cnpjTomador });
    if (!empresa) {
      return res.status(404).json({ mensagem: "Empresa associada ao CNPJ não encontrada." });
    }

    // Verificar se a empresa tem as credenciais Omie
    const { appKeyOmie, appSecretOmie } = empresa;
    if (!appKeyOmie || !appSecretOmie) {
      return res.status(400).json({ mensagem: "Credenciais Omie da empresa não encontradas." });
    }

    // Consultar a conta a pagar na Omie usando o serviço de consulta
    const contaPagarOmie = await consultar(appKeyOmie, appSecretOmie, codigoLancamento);

    // Verificar se o status do título é "PAGO"
    if (contaPagarOmie.status_titulo === "PAGO") {
      // Alterar o status do ticket para "concluído"
      ticket.status = "concluido";
      ticket.etapa = "concluido";
      await ticket.save();
    }

    return res.status(200).json(contaPagarOmie);
  } catch (error) {
    console.error("Erro ao obter conta a pagar Omie:", error);
    return res
      .status(500)
      .json({ mensagem: "Erro ao obter conta a pagar Omie.", erro: error.message });
  }
};

module.exports = { obterContaPagarOmie };
