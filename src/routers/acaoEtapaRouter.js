const express = require("express");
const router = express.Router();
const multer = require("multer");
const acaoEtapaController = require("../controllers/acaoEtapaController");
const { importarServico } = require("../controllers/importacao/servico");
const { importarPrestador } = require("../controllers/importacao/prestador");
const {
  importarDocumentoFiscal,
} = require("../controllers/importacao/documentosFiscais");

// Configuração do armazenamento (aqui, salvando no disco)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Certifique-se de que esta pasta exista
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Configuração de armazenamento para a rota `importar-rpas`
const inMemoryStorage = multer.memoryStorage({});

// Filtrando arquivos (opcional)
const fileFilter = (req, file, cb) => {
  const tiposPermitidos = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.binary.macroenabled.12",
  ];

  // Aceitar apenas arquivos Excel
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

// Inicializando o upload
const upload = multer({
  storage: inMemoryStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }, // Limite de 10MB
});

// Filtrando arquivos (opcional)
const rpasFileFilter = (req, file, cb) => {
  // Aceitar apenas arquivos pdf ou zip
  const allowedTipes = [
    "application/zip",
    "application/x-zip-compressed",
    "application/pdf",
  ];

  if (allowedTipes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

// Inicializando o upload com configuração específica para `importar-rpas`
const uploadRpas = multer({
  storage: inMemoryStorage,
  fileFilter: rpasFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo
});

router.post("/exportar-servicos", acaoEtapaController.exportarServicos);
router.post("/exportar-prestadores", acaoEtapaController.exportarPrestadores);

router.post("/importar-servicos", upload.array("file"), importarServico);
router.post("/importar-prestadores", upload.array("file"), importarPrestador);

router.post(
  "/importar-documentos-fiscais",
  upload.array("file"),
  importarDocumentoFiscal
);

router.post(
  "/importar-rpas",
  uploadRpas.array("file", 50),
  acaoEtapaController.importarRPAs
);

module.exports = router;
