const { Router } = require("express");
const { valoresPorStatus } = require("../controllers/dashboard/servicos");
const router = Router();

router.get("/servicos/valores", valoresPorStatus);

module.exports = router;
