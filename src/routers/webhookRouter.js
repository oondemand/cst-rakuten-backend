const express = require("express");
const router = express.Router();

router.post("/conta-pagar", async (req, res) => {
  try {
    console.log("🟢 LOG", req.body);
    const { appKey, event, ping, topic } = req.body;
    if (ping === "omie") return res.status(200).json({ message: "pong" });

    res.status(200).json({ message: "Webhook recebido. Fatura sendo gerada." });
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    res.status(500).json({ error: "Erro ao processar o webhook." });
  }
});

module.exports = router;
