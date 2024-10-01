const Nfse = require("../models/Nfse");
const Ticket = require("../models/Ticket");

// Criar uma nova NFSe
exports.createNfse = async (req, res) => {
  try {
    const nfse = new Nfse(req.body);
    await nfse.save();
    res.status(201).json({
      message: "NFSe criada com sucesso!",
      nfse,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Erro ao criar a NFSe",
      detalhes: error.message,
    });
  }
};

// Obter todas as NFSe
exports.getAllNfse = async (req, res) => {
  try {
    const filters = req.query; // Obtém os filtros dos parâmetros de consulta
    const nfseList = await Nfse.find(filters); // Aplica os filtros na consulta
    res.status(200).json(nfseList);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar as NFSe",
      detalhes: error.message,
    });
  }
};

// Obter uma NFSe específica pelo ID
exports.getNfseById = async (req, res) => {
  try {
    const nfse = await Nfse.findById(req.params.id);
    if (!nfse) return res.status(404).json({ message: "NFSe não encontrada" });
    res.status(200).json(nfse);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao buscar a NFSe",
      detalhes: error.message,
    });
  }
};

// Atualizar uma NFSe pelo ID
exports.updateNfse = async (req, res) => {

  try {
    const nfse = await Nfse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!nfse) return res.status(404).json({ message: "NFSe não encontrada" });
    res.status(200).json({
      message: "NFSe atualizada com sucesso!",
      nfse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao atualizar a NFSe",
      detalhes: error.message,
    });
  }
};

// Deletar uma NFSe pelo ID
exports.deleteNfse = async (req, res) => {
  try {
    const nfse = await Nfse.findByIdAndDelete(req.params.id);
    if (!nfse) return res.status(404).json({ message: "NFSe não encontrada" });
    res.status(200).json({
      message: "NFSe deletada com sucesso!",
      nfse,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erro ao deletar a NFSe",
      detalhes: error.message,
    });
  }
};

// Listar NFS-e que ainda não têm um ticket associado
exports.getNfseWithoutTicket = async (req, res) => {
  try {
    // Primeiro, obtenha todos os IDs de NFS-e que já têm um ticket associado
    const nfsesComTicket = await Ticket.find().distinct("nfse");

    // Obtenha os filtros dos parâmetros de consulta
    const filters = req.query;

    // Adicione a condição para excluir as NFS-e que já têm um ticket associado
    filters._id = { $nin: nfsesComTicket };

    // Encontre todas as NFS-e que correspondem aos filtros
    const nfseList = await Nfse.find(filters);

    res.status(200).json(nfseList);
  } catch (error) {
    console.error("Erro ao buscar as NFS-e sem ticket:", error);
    res.status(500).json({
      message: "Erro ao buscar as NFS-e sem ticket",
      detalhes: error.message,
    });
  }
};

exports.processarXml = async (req, res) => {
  try {
    const xml = req.body;
    console.log("Tipo de dado recebido:", typeof xml);
    console.log("Dados recebidos:", JSON.stringify(xml, null, 2));

    if (!xml || Object.keys(xml).length === 0) {
      return res.status(400).json({ message: "O corpo da requisição não contém o XML válido." });
    }

    const nfseData = await processarXmlNfse(xml);
    return res.status(200).json({ nfse: nfseData });
  } catch (error) {
    console.error("Erro ao processar NFSe:", error);
    return res.status(500).json({ message: "Falha ao processar o XML", detalhes: error.message });
  }
};
