const { createQueue } = require("../../index");
const IntegracaoPrestadorOmieCentral = require("../../../../models/integracao/prestador/omie-central");
const Prestador = require("../../../../models/Prestador");
const { retryAsync, sleep } = require("../../../../utils");
const BaseOmie = require("../../../../models/BaseOmie");
const {
  buscarPrestadorOmie,
} = require("../../../prestador/buscarPrestadorOmie");
const clienteService = require("../../../omie/clienteService");
const { randomUUID } = require("crypto");

const handler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    console.log(integracao);
  } catch (error) {
    console.log("Err", error);
  }
};

const fetchNextIntegracao = async () => {
  let integracao = await IntegracaoPrestadorOmieCentral.findOneAndUpdate(
    { etapa: "requisicao" },
    { etapa: "processando", executadoEm: new Date() },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!integracao) {
    integracao = await IntegracaoPrestadorOmieCentral.findOneAndUpdate(
      { etapa: "reprocessar" },
      { etapa: "processando", executadoEm: new Date() },
      { sort: { createdAt: 1 }, new: true }
    );
  }

  return integracao;
};

const queue = createQueue({
  handler: handler,
  next: fetchNextIntegracao,
});

module.exports = queue;
