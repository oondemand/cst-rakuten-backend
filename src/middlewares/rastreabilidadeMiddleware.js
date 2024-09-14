const Log = require("../models/Log");

const rastreabilidadeMiddleware = async (req, res, next) => {
  // Verifica se o método da requisição é GET
  if (req.method === "GET") {
    return next(); // Ignora a requisição e passa para o próximo middleware
  }

  const inicio = Date.now(); // Marca o início da requisição

  // Extrair informações da requisição
  const usuarioId = req.user ? req.user.id : null; // ID do usuário, se estiver logado
  const endpoint = req.originalUrl; // A URL completa
  const metodo = req.method; // O método HTTP (GET, POST, etc.)
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress; // IP do cliente
  const dadosRequisicao = req.body; // O corpo da requisição

  // Capturar as informações da resposta usando `res.on()`
  const log = new Log({
    usuario: usuarioId,
    endpoint: endpoint,
    metodo: metodo,
    ip: ip,
    dadosRequisicao: dadosRequisicao,
  });

  // Interceptar o status e o corpo da resposta
  const originalSend = res.send; // Armazena o método original `res.send`

  res.send = function (body) {
    // Captura o status e o corpo da resposta
    log.statusResposta = res.statusCode;
    log.dadosResposta = body;

    // Salva o log no banco de dados
    log
      .save()
      .then(() => console.log("Log de rastreabilidade salvo com sucesso"))
      .catch((error) => console.error("Erro ao salvar log de rastreabilidade:", error));

    // Retorna a resposta original
    originalSend.apply(res, arguments);
  };

  // Continua para o próximo middleware ou controlador
  next();
};

module.exports = rastreabilidadeMiddleware;
