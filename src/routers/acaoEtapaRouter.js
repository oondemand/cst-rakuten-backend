const express = require("express");
const router = express.Router();
const multer = require('multer');
const acaoEtapaController = require("../controllers/acaoEtapaController");

// Configuração do armazenamento (aqui, salvando no disco)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Certifique-se de que esta pasta exista
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtrando arquivos (opcional)
const fileFilter = (req, file, cb) => {
  // Aceitar apenas arquivos Excel
  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimetype === 'application/vnd.ms-excel'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado'), false);
  }
};

// Inicializando o upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
});

router.post("/importar-comissoes", upload.single('file'), acaoEtapaController.importarComissoes);
router.post("/exportar-servicos", acaoEtapaController.exportarServicos);
router.post("/exportar-prestadores", acaoEtapaController.exportarPrestadores);
router.post("/importar-prestadores", acaoEtapaController.importarPrestadores);
router.post("/importar-rpas", acaoEtapaController.importarRPAs);

module.exports = router;
