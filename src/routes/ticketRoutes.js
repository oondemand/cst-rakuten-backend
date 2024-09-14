const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/", ticketController.createTicket);

router.get("/", ticketController.getAllTickets);
router.get("/:id", ticketController.getTicketById);

router.put("/:id", ticketController.updateTicket);
router.put("/:id/status", ticketController.updateStatusTicket);

router.delete("/:id", ticketController.deleteTicket);

// Associar um arquivo a uma NFS-e
router.post("/:id/arquivo/:arquivoId", ticketController.associarArquivoAoTicket);

// Listar arquivos associados a uma NFS-e
router.get("/:id/arquivos", ticketController.listarArquivosDoTicket);

module.exports = router;
