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
    integracao.executadoEm = new Date();
    integracao.tentativas = (integracao.tentativas || 0) + 1;
    await integracao.save();

    const { errors, result } = await retryAsync(async () => {
      const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
      const clienteOmie = await clienteService.consultar(
        appKey,
        appSecret,
        integracao.codigo_cliente_omie
      );

      const sid = clienteOmie.caracteristicas.find(
        (item) => item.campo?.toUpperCase() === "SID"
      )?.conteudo;

      throw new Error("Erro para fins de teste.");

      const prestador = await Prestador.findOneAndUpdate(
        { sid },
        { ...integracao.prestador, status_sincronizacao_omie: "sucesso" }
      );

      if (!prestador) {
        await Prestador.create({
          ...integracao.prestador,
          codigo_cliente_omie: integracao.codigo_cliente_omie,
          status_sincronizacao_omie: "sucesso",
          sid,
        });
      }

      return { message: "Prestador sincronizado com sucesso" };
    });

    if (!result && integracao.tentativas < 3) {
      await sleep(1000 * 60); // Espera 1 minuto antes de tentar outra requisição
      integracao.etapa = "reprocessar";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];
      await integracao.save();

      return;
    }

    if (!result && integracao.tentativas >= 3) {
      integracao.etapa = "falhas";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];
      await integracao.save();

      return;
    }

    if (result) {
      integracao.etapa = "sucesso";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];
      integracao.resposta = result;
      await integracao.save();

      return;
    }
  } catch (err) {
    integracao.etapa = "falhas";
    integracao.errors = [
      ...(integracao.errors || []),
      err?.response?.data ?? err?.message,
    ];
    integracao.executadoEm = new Date();
    await integracao.save();
  }
};

const fetchNextIntegracao = async () => {
  let integracao = await IntegracaoPrestadorOmieCentral.findOneAndUpdate(
    { etapa: "requisicao", arquivado: false },
    { etapa: "processando", executadoEm: new Date() },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!integracao) {
    integracao = await IntegracaoPrestadorOmieCentral.findOneAndUpdate(
      { etapa: "reprocessar", arquivado: false },
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
