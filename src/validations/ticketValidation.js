const Joi = require('joi');

const ticketValidation = (data) => {
  const schema = Joi.object({
    titulo: Joi.string().required().messages({
      "string.base": `"Título" deve ser um texto`,
      "string.empty": `"Título" não pode ser vazio`,
      "any.required": `"Título" é um campo obrigatório`,
    }),
    observacao: Joi.string().optional().allow('').messages({
      "string.base": `"Observação" deve ser um texto`,
    }),
    etapa: Joi.string().required().messages({
      "any.only": `"Etapa" deve ser uma das seguintes: 'aprovacao-servico', 'aprovacao-fiscal', 'aprovacao-financeira', 'concluido'`,
      "any.required": `"Etapa" é um campo obrigatório`,
    }),
    status: Joi.string().valid('aguardando-inicio', 'trabalhando', 'revisao', 'aprovado', 'concluido', 'arquivado').default('aprovacao-serviço').messages({
      "any.only": `"Status" deve ser uma das seguintes: 'aguardando-inicio', 'trabalhando', 'revisao', 'aprovado', 'concluido', 'arquivado'`,
    }),
    nfse: Joi.string().required().messages({
      "string.base": `"NFSe" deve ser um ID válido`,
      "string.empty": `"NFSe" não pode ser vazio`,
      "any.required": `"NFSe" é um campo obrigatório`,
    }),
  });

  return schema.validate(data, { abortEarly: false });
};

module.exports = { ticketValidation };
