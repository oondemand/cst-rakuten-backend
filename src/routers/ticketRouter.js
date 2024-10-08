const express = require("express");
const router = express.Router();
const ticketController = require("../controllers/ticketController");

router.post("/", ticketController.createTicket);

router.get("/", ticketController.getAllTickets);
router.get("/base-omie/:baseOmieId", ticketController.getAllByBaseOmie);
router.get('/prestador/:prestadorId', ticketController.getTicketsByPrestadorId);
router.get("/:id", ticketController.getTicketById);
router.get("/:id/arquivos", ticketController.listarArquivosDoTicket);

router.patch("/:id", ticketController.updateTicket);
router.patch("/:id/status", ticketController.updateStatusTicket);

router.delete("/:id", ticketController.deleteTicket);

// Associar um arquivo a uma NFS-e
router.post("/:id/arquivo/:arquivoId", ticketController.associarArquivoAoTicket);

// Listar arquivos associados a uma NFS-e

module.exports = router;
