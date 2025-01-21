const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Rota raiz para verificar o status do serviço e a conexão com o MongoDB
router.get("/", async (req, res) => {
  const dbState = mongoose.connection.readyState; // Verifica o status da conexão com o DB
  const status = {
    0: "Desconectado",
    1: "Conectado",
    2: "Conectando",
    3: "Desconectando",
  };

  res.status(200).json({
    message: `${process.env.SERVICE_NAME} rodando - vs ${process.env.SERVICE_VERSION}`,
    database: status[dbState]
      ? `${status[dbState]} em ${process.env.DB_NAME}`
      : "Status desconhecido",
  });
});

module.exports = router;
