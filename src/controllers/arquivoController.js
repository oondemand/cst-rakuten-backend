const Arquivo = require("../models/Arquivo");
const path = require("path");
const fs = require("fs");

// Função para realizar upload de um arquivo
const uploadArquivo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    const arquivo = new Arquivo({
      nomeOriginal: req.file.originalname,
      nomeArmazenado: req.file.filename,
      mimeType: req.file.mimetype,
      caminho: req.file.path,
      tamanho: req.file.size,
    });

    await arquivo.save();

    res.status(201).json({ message: "Arquivo enviado com sucesso", arquivo });
  } catch (error) {
    res.status(500).json({ message: "Erro ao enviar arquivo", error: error.message });
  }
};

// Função para listar todos os arquivos
const listarArquivos = async (req, res) => {
  try {
    const arquivos = await Arquivo.find();
    res.status(200).json(arquivos);
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar arquivos", error: error.message });
  }
};

// Função para remover um arquivo
const removerArquivo = async (req, res) => {
  try {
    const { id } = req.params;

    const arquivo = await Arquivo.findById(id);
    if (!arquivo) {
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }

    // Remove o arquivo do sistema de arquivos
    fs.unlinkSync(path.join(__dirname, "..", arquivo.caminho));

    // Remove o arquivo do banco de dados
    await Arquivo.findByIdAndDelete(id);

    res.status(200).json({ message: "Arquivo removido com sucesso" });
  } catch (error) {
    res.status(500).json({ message: "Erro ao remover arquivo", error: error.message });
  }
};

// Baixar arquivo
const baixarArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const arquivo = await Arquivo.findById(id);

    if (!arquivo) {
      return res.status(404).json({ message: "Arquivo não encontrado" });
    }

    const filePath = path.join(__dirname, "..", arquivo.caminho);
    res.download(filePath, arquivo.nomeOriginal);
  } catch (error) {
    res.status(500).json({ message: "Erro ao baixar arquivo", error: error.message });
  }
};

module.exports = { uploadArquivo, listarArquivos, removerArquivo, baixarArquivo };
