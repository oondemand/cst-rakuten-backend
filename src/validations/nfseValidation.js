const Joi = require("joi");

// Validação para Valores do Serviço
const valoresNfseSchema = Joi.object({
  aliquota: Joi.number().required().messages({
    "number.base": "A alíquota deve ser um número.",
    "any.required": "A alíquota é obrigatória.",
  }),
  valorIss: Joi.number().required().messages({
    "number.base": "O valor do ISS deve ser um número.",
    "any.required": "O valor do ISS é obrigatório.",
  }),
  valorServicos: Joi.number().required().messages({
    "number.base": "O valor dos serviços deve ser um número.",
    "any.required": "O valor dos serviços é obrigatório.",
  }),
});

// Validação para Serviço
const servicoSchema = Joi.object({
  valores: valoresNfseSchema.required(),
  issRetido: Joi.number().valid(0, 1).required().messages({
    "any.only": "O valor de ISS Retido deve ser 0 ou 1.",
    "any.required": "O campo ISS Retido é obrigatório.",
  }),
  discriminacao: Joi.string().max(500).required().messages({
    "string.base": "A discriminação deve ser uma string.",
    "string.max": "A discriminação não pode ter mais de 500 caracteres.",
    "any.required": "A discriminação é obrigatória.",
  }),
});

// Validação para Declaração de Prestação de Serviço
const declaracaoPrestacaoServicoSchema = Joi.object({
  competencia: Joi.string()
    .pattern(/^(0[1-9]|1[0-2])\/\d{4}$/)
    .required()
    .messages({
      "string.pattern.base": "A competência deve estar no formato MM/YYYY.",
      "any.required": "A competência é obrigatória.",
    }),
  servico: servicoSchema.required(),
  optanteSimplesNacional: Joi.number().valid(0, 1).required().messages({
    "any.only": "O campo Optante pelo Simples Nacional deve ser 0 ou 1.",
    "any.required": "O campo Optante pelo Simples Nacional é obrigatório.",
  }),

});

// Validação para InfoNfse
const infoNfseSchema = Joi.object({
  numero: Joi.number().required().messages({
    "number.base": "O número da NFSe deve ser um número.",
    "any.required": "O número da NFSe é obrigatório.",
  }),
  dataEmissao: Joi.date().required().messages({
    "date.base": "A data de emissão deve ser uma data válida.",
    "any.required": "A data de emissão é obrigatória.",
  }),
  prestador: Joi.object({
    tipo: Joi.string().valid("pf", "pj").required().messages({
      "any.only": "O tipo de prestador deve ser 'pf' ou 'pj'.",
      "any.required": "O tipo do prestador é obrigatório.",
    }),
    documento: Joi.string().required().messages({
      "string.base": "O documento do prestador deve ser uma string.",
      "any.required": "O documento do prestador é obrigatório.",
    }),
    nome: Joi.string().required().messages({
      "string.base": "O nome do prestador deve ser uma string.",
      "any.required": "O nome do prestador é obrigatório.",
    }),
  }).required(),
  tomador: Joi.object({
    tipo: Joi.string().valid("pf", "pj").required().messages({
      "any.only": "O tipo de tomador deve ser 'pf' ou 'pj'.",
      "any.required": "O tipo do tomador é obrigatório.",
    }),
    documento: Joi.string().required().messages({
      "string.base": "O documento do tomador deve ser uma string.",
      "any.required": "O documento do tomador é obrigatório.",
    }),
    nome: Joi.string().required().messages({
      "string.base": "O nome do tomador deve ser uma string.",
      "any.required": "O nome do tomador é obrigatório.",
    }),
  }).required(),
  declaracaoPrestacaoServico: declaracaoPrestacaoServicoSchema.required(),
});

// Validação principal da NFSe
const nfseSchema = Joi.object({
  infoNfse: infoNfseSchema.required(),
});

// Função de validação
module.exports = {
  validateNfse: (data) => nfseSchema.validate(data, { abortEarly: false }),
};
