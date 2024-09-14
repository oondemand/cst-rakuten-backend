const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");

// Carregar variáveis de ambiente
dotenv.config();

const authMiddleware = require("./middlewares/authMiddleware"); // Supondo que já existe
const rastreabilidadeMiddleware = require("./middlewares/rastreabilidadeMiddleware");

const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Configuração do CORS para permitir todas as origens
app.use(cors());

// Verifique se o ambiente é de desenvolvimento
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use("/auth", require("./routes/authRoutes"));

app.use(authMiddleware);
app.use(rastreabilidadeMiddleware);

// Definição de rotas
app.use("/usuarios", require("./routes/usuarioRoutes"));
app.use("/empresas", require("./routes/empresaRoutes"));
app.use("/tickets", require("./routes/ticketRoutes"));
app.use("/nfse", require("./routes/nfseRoutes"));
app.use("/aprovacoes", require("./routes/aprovacaoRoutes"));
app.use("/contas-pagar", require("./routes/contaPagarRoutes"));
app.use("/etapas", require("./routes/etapaRoutes"));
app.use("/arquivos", require("./routes/arquivoRoutes"));
app.use("/logs", require("./routes/logRoutes"));


// Middleware de erro (opcional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;
