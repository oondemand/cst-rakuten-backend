const { createQueue } = require("../index");
const IntegracaoPrestador = require("../../../models/IntegracaoPrestador");
const Prestador = require("../../../models/Prestador");
const { sincronizarPrestador } = require("../../omie/sincronizarPrestador");

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const executarComTentativas = async ({ callback, limit, onTry }) => {
  const erros = [];

  for (let tentativa = 1; tentativa <= limit; tentativa++) {
    await onTry?.(tentativa);
    try {
      const resultado = await callback();
      return { resultado, erros };
    } catch (err) {
      erros.push(err?.response?.data?.faultstring ?? err?.message);
    }
  }

  return { resultado: null, erros };
};

const prestadorHandler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    integracao.executadoEm = new Date();

    const { erros, resultado } = await executarComTentativas({
      callback: async () => {
        return await sincronizarPrestador({ prestador: integracao.prestador });
      },
      limit: 3,
      onTry: async (tentativa) => {
        if (tentativa === 2) await sleep(1000 * 10);
        if (tentativa >= 3) await sleep(1000 * 30);
        integracao.tentativas = (integracao.tentativas || 0) + 1;
      },
    });

    if (resultado) {
      integracao.etapa = "sucesso";
      integracao.erros = [...(integracao.erros || []), ...erros];
      integracao.resposta = resultado;
      await integracao.save();

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "sucesso",
        codigo_cliente_omie: resultado.codigo_cliente_omie,
      });
    } else {
      integracao.etapa = "falhas";
      integracao.erros = [...(integracao.erros || []), ...erros];
      await integracao.save();

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "erro",
      });
    }

    console.log(
      `🈯 Integração do prestador ${integracao.prestadorId} finalizada`
    );
  } catch (err) {
    console.log("ERROR", err);

    integracao.etapa = "falhas";
    integracao.erros = [
      ...(integracao.erros || []),
      err?.response?.data?.faultstring ?? err?.message,
    ];
    integracao.executadoEm = new Date();
    await integracao.save();

    await Prestador.findByIdAndUpdate(integracao.prestadorId, {
      status_sincronizacao_omie: "erro",
    });
  }
};

const fetchNextIntegracao = async () => {
  let integracao = await IntegracaoPrestador.findOneAndUpdate(
    { etapa: "requisicao" },
    { etapa: "processando", executadoEm: new Date() },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!integracao) {
    integracao = await IntegracaoPrestador.findOneAndUpdate(
      { etapa: "reprocessar" },
      { etapa: "processando", executadoEm: new Date() },
      { sort: { createdAt: 1 }, new: true }
    );
  }

  return integracao;
};

const filaPrestador = createQueue({
  handler: prestadorHandler,
  next: fetchNextIntegracao,
});

module.exports = { filaPrestador };
