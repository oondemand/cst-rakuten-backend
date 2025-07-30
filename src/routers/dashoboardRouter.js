const { Router } = require("express");
const { valoresPorStatus } = require("../controllers/dashboard/servicos");
const {
  ticketsPorStatus,
  ticketsPorEtapa,
} = require("../controllers/dashboard/tickets");
const {
  integracaoPrestadorOmieCentralPorEtapa,
} = require("../controllers/dashboard/integracao");

const router = Router();

router.get("/servicos/valores", valoresPorStatus);
router.get("/tickets/status", ticketsPorStatus);
router.get("/tickets/etapa", ticketsPorEtapa);
router.get("/integracao", integracaoPrestadorOmieCentralPorEtapa);

module.exports = router;
