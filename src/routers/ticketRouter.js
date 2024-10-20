const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const multer = require('multer');
const path = require('path');
const Arquivo = require('../models/Arquivo');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/tickets/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Aceitar apenas certos tipos de arquivos, por exemplo, imagens e PDFs
  const allowedTypes = /jpeg|jpg|png|pdf|xml|txt/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Tipo de arquivo não suportado'));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB por arquivo
});

router.post("/:id/upload", upload.array('arquivos', 10), ticketController.uploadArquivos); 


router.post("/", ticketController.createTicket);

router.get("/", ticketController.getAllTickets);
router.get("/base-omie/:baseOmieId", ticketController.getAllByBaseOmie);
router.get('/prestador/:prestadorId', ticketController.getTicketsByPrestadorId);
router.get("/:id", ticketController.getTicketById);
router.get("/:id/arquivos", ticketController.listarArquivosDoTicket);

router.patch("/:id", ticketController.updateTicket);
router.patch("/:id/status", ticketController.updateStatusTicket);

router.delete("/:id", ticketController.deleteTicket);

module.exports = router;
