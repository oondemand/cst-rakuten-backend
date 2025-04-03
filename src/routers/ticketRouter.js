const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");
const multer = require("multer");
const path = require("node:path");
const Arquivo = require("../models/Arquivo");

const storage = multer.memoryStorage({});

const fileFilter = (req, file, cb) => {
  return cb(null, true);

  // Aceitar apenas certos tipos de arquivos, por exemplo, imagens e PDFs
  const allowedTypes = /jpeg|jpg|png|pdf|xml|txt/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Tipo de arquivo não suportado"));
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1 * 1024 * 1024 }, // Limite de 1MB por arquivo
});

router.post(
  "/:id/upload",
  upload.array("arquivos", 10),
  ticketController.uploadFiles
);

router.get("/:id/arquivos", ticketController.listFilesFromTicket);
router.delete("/arquivo/:id", ticketController.deleteFileFromTicket);
router.get("/arquivo/:id", ticketController.getArquivoPorId);

router.post("/", ticketController.createTicket);

router.get("/", ticketController.getAllTickets);
router.get("/arquivados", ticketController.getArchivedTickets);
router.get("/pagos", ticketController.getTicketsPago);

router.get("/base-omie/:baseOmieId", ticketController.getAllByBaseOmie);
router.get("/prestador/:prestadorId", ticketController.getTicketsByPrestadorId);
router.get(
  "/usuario-prestador/:usuarioId",
  ticketController.getTicketsByUsuarioPrestador
);
router.get("/:id", ticketController.getTicketById);

router.patch("/:id", ticketController.updateTicket);
router.patch("/:id/status", ticketController.updateStatusTicket);

router.delete("/:id", ticketController.deleteTicket);

router.post(
  "/adicionar-servico/:ticketId/:servicoId/",
  ticketController.addServico
);

router.post("/remover-servico/:servicoId", ticketController.removeServico);

module.exports = router;
