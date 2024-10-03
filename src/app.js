const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const YAML = require("yamljs");
const path = require("path");

// Carregar variáveis de ambiente
dotenv.config();

const authMiddleware = require("./middlewares/authMiddleware"); // Supondo que já existe
const rastreabilidadeMiddleware = require("./middlewares/rastreabilidadeMiddleware");

const app = express();

// Middlewares globais
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// **Rotas públicas** - Não requerem autenticação

// Verifique se o ambiente é de desenvolvimento
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// **Rotas públicas** - Não requerem autenticação
app.use("/", require("./routers/statusRouter"));  // Rota de status

app.use("/open-api", (req, res) => {
  const schemaOpenAPI = YAML.load("./schemaOpenAPI.yaml");
  res.json(schemaOpenAPI);
});

app.use("/auth", require("./routers/authRouter"));  // Rotas de autenticação (login, etc.)

// **Middleware de autenticação** - Aplica-se apenas às rotas que necessitam de proteção
app.use(authMiddleware);

// **Middleware de rastreabilidade** - Pode ser aplicado depois do de autenticação, se necessário
app.use(rastreabilidadeMiddleware);

// **Rotas protegidas** - Necessitam de autenticação
app.use("/usuarios", require("./routers/usuarioRouter"));
app.use("/baseomies", require("./routers/baseOmieRouter"));
app.use("/tickets", require("./routers/ticketRouter"));
app.use("/aprovacoes", require("./routers/aprovacaoRouter"));
app.use("/contas-pagar", require("./routers/contaPagarRouter"));
app.use("/etapas", require("./routers/etapaRouter"));
app.use("/logs", require("./routers/logRouter"));
app.use("/prestadores", require("./routers/prestadorRouter"));

// Middleware de erro (opcional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Algo deu errado!");
});

module.exports = app;
