const { createQueue } = require("../index");
const IntegracaoPrestador = require("../../../models/IntegracaoPrestador");
const Prestador = require("../../../models/Prestador");
const { retryAsync, sleep } = require("../../../utils");
const BaseOmie = require("../../../models/BaseOmie");
const { buscarPrestadorOmie } = require("../../prestador/buscarPrestadorOmie");
const clienteService = require("../../omie/clienteService");
const { randomUUID } = require("crypto");

const prestadorHandler = async (integracao) => {
  if (!integracao || integracao.arquivado) return;

  try {
    integracao.executadoEm = new Date();

    const cliente = clienteService.criarFornecedor({
      prestador: integracao.prestador,
    });

    integracao.payload = cliente;
    await integracao.save();

    const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
    let prestadorOmie = await buscarPrestadorOmie({
      appKey,
      appSecret,
      prestador: integracao.prestador,
    });

    const { errors, result } = await retryAsync({
      callback: async () => {
        if (prestadorOmie) {
          cliente.codigo_cliente_omie = prestadorOmie.codigo_cliente_omie;
          return await clienteService.update(appKey, appSecret, cliente);
        }
        if (!prestadorOmie) {
          cliente.codigo_cliente_integracao = randomUUID();
          return await clienteService.incluir(appKey, appSecret, cliente);
        }
      },
      limit: 1,
      onTry: async (tentativa) => {
        if (tentativa === 2) await sleep(1000 * 10); // 10 seg
        if (tentativa >= 3) await sleep(1000 * 60 * 3); // 3 min
        integracao.tentativas = (integracao.tentativas || 0) + 1;
      },
    });

    const formattedErrors = errors?.map((e) => {
      return e?.response?.data;
    });

    if (result) {
      integracao.etapa = "sucesso";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(formattedErrors || []),
      ];
      integracao.resposta = result;
      await integracao.save();

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "sucesso",
        codigo_cliente_omie: result.codigo_cliente_omie,
      });
    } else {
      integracao.etapa = "falhas";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(formattedErrors || []),
      ];
      await integracao.save();

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "erro",
      });
    }
  } catch (err) {
    console.log(err);
    integracao.etapa = "falhas";
    integracao.errors = [
      ...(integracao.errors || []),
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
