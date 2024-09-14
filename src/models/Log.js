const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario", // Referência ao usuário que fez a requisição
      required: false, // Pode ser null se for uma ação pública ou do sistema
    },
    endpoint: {
      type: String,
      required: true, // Ex: '/api/tickets/123'
    },
    metodo: {
      type: String,
      required: true, // GET, POST, PUT, DELETE, etc.
    },
    ip: {
      type: String,
      required: true, // IP do cliente que fez a requisição
    },
    dadosRequisicao: {
      type: Object, // Corpo da requisição (JSON)
    },
    dadosResposta: {
      type: Object, // Corpo da resposta (JSON)
    },
    statusResposta: {
      type: Number, // Código de status da resposta (200, 404, 500, etc.)
    },
  },
  {
    timestamps: true, // Adiciona campos de createdAt e updatedAt automaticamente
  }
);

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
