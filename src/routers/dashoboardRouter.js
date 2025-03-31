const { Router } = require("express");
const { valoresPorStatus } = require("../controllers/dashboard/servicos");
const {
  ticketsPorStatus,
  ticketsPorEtapa,
} = require("../controllers/dashboard/tickets");

const router = Router();

router.get("/servicos/valores", valoresPorStatus);
router.get("/tickets/status", ticketsPorStatus);
router.get("/tickets/etapa", ticketsPorEtapa);

module.exports = router;
