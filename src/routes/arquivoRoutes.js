const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const arquivoController = require("../controllers/arquivoController");

// Configurar o armazenamento dos arquivos com multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Diretório de armazenamento dos arquivos
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo no servidor
  },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("arquivo"), arquivoController.uploadArquivo);
router.get("/", arquivoController.listarArquivos);
router.get("/download/:id", arquivoController.baixarArquivo);
router.delete("/:id", arquivoController.removerArquivo);

module.exports = router;
