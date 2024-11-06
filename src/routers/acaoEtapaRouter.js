const express = require("express");
const router = express.Router();
const multer = require("multer");
const acaoEtapaController = require("../controllers/acaoEtapaController");

const path = require("node:path");

// Configuração do armazenamento (aqui, salvando no disco)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Certifique-se de que esta pasta exista
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

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
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
});

router.post(
  "/importar-comissoes",
  upload.single("file"),
  acaoEtapaController.importarComissoes,
);

// Filtrando arquivos (opcional)
const rpasFileFilter = (req, file, cb) => {
  // Aceitar apenas arquivos pdf
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não suportado"), false);
  }
};

// Configuração de armazenamento para a rota `importar-rpas`
const rpasStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/rpas/"); // Pasta específica para RPA
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Inicializando o upload com configuração específica para `importar-rpas`
const uploadRpas = multer({
  storage: rpasStorage,
  fileFilter: rpasFileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limite de 1MB
});

router.get("/exportar-servicos", acaoEtapaController.exportarServicos);
router.get("/exportar-prestadores", acaoEtapaController.exportarPrestadores);
router.post("/importar-prestadores", acaoEtapaController.importarPrestadores);
router.post(
  "/importar-rpas",
  uploadRpas.single("file"),
  acaoEtapaController.importarRPAs,
);

module.exports = router;
