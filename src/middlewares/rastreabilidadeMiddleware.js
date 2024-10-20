const Log = require("../models/Log");

const rastreabilidadeMiddleware = async (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }

  const inicio = Date.now();
  const usuarioId = req.usuario ? req.usuario.id : null;
  const endpoint = req.originalUrl;
  const metodo = req.method;
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const dadosRequisicao = req.body;

  const log = new Log({
    usuario: usuarioId,
    endpoint: endpoint,
    metodo: metodo,
    ip: ip,
    dadosRequisicao: dadosRequisicao,
  });

  res.on("finish", () => {
    log.statusResposta = res.statusCode;
    log.dadosResposta = res.locals.body || null; // Capturar o corpo se armazenado anteriormente

    log
      .save()
      .then(() => console.log("Log de rastreabilidade salvo com sucesso"))
      .catch((error) => console.error("Erro ao salvar log de rastreabilidade:", error));
  });

  next();
};

module.exports = rastreabilidadeMiddleware;
