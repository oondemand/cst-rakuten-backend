const { Router } = require("express");
const {
  createEstado,
  getAllEstados,
  getEstadoById,
  updateEstado,
  deleteEstado,
} = require("../controllers/estadoController.js");

const router = Router();

router.post("/", createEstado);
router.get("/", getAllEstados);
router.get("/:id", getEstadoById);
router.put("/:id", updateEstado);
router.delete("/:id", deleteEstado);

module.exports = router;
