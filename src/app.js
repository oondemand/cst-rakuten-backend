const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const YAML = require("yamljs");

const path = require("node:path");
const multer = require("multer");

// Carregar variáveis de ambiente
dotenv.config();

const authMiddleware = require("./middlewares/authMiddleware");
const rastreabilidadeMiddleware = require("./middlewares/rastreabilidadeMiddleware");

const app = express();

// Middlewares globais
app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(helmet());
app.use(express.static(path.join(__dirname, "public")));

app.use(morgan("dev"));

// **Rotas públicas** - Não requerem autenticação
app.use("/", require("./routers/statusRouter"));

app.use("/open-api", (req, res) => {
  const schemaOpenAPI = YAML.load("./schemaOpenAPI.yaml");
  res.json(schemaOpenAPI);
});

app.use("/auth", require("./routers/authRouter"));

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
app.use("/servicos", require("./routers/servicoRouter"));
app.use("/acoes-etapas", require("./routers/acaoEtapaRouter"));
app.use("/registros", require("./routers/controleAlteracao"));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Middleware de erro
app.use((err, req, res, next) => {
  console.log("Middleware de Erro Invocado");
  console.log("Erro:", err);

  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      console.log("Erro de Limite de Tamanho de Arquivo");
      return res.status(413).json({
        message: err.message,
      });
    }

    console.log("Erro de Multer:", err.message);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    console.log("Erro Interno do Servidor:", err.message);
    return res.status(500).json({ message: err.message });
  }
  next();
});

module.exports = app;
