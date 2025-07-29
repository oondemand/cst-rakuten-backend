const { createQueue } = require("../../index");
const IntegracaoPrestadorCentralOmie = require("../../../../models/integracao/prestador/central-omie");
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
    const cliente = clienteService.criarFornecedor({
      prestador: integracao.prestador,
    });

    const { appKey, appSecret } = await BaseOmie.findOne({ status: "ativo" });
    let prestadorOmie = await buscarPrestadorOmie({
      appKey,
      appSecret,
      prestador: integracao.prestador,
    });

    integracao.executadoEm = new Date();
    integracao.tentativas = (integracao.tentativas || 0) + 1;
    integracao.requisicao = {
      url: `${process.env.API_OMIE}/geral/clientes/`,
      body: {
        call: prestadorOmie ? "AlterarCliente" : "IncluirCliente",
        app_key: appKey,
        app_secret: appSecret,
        param: [cliente],
      },
    };

    await integracao.save();

    const { errors, result } = await retryAsync(async () => {
      if (prestadorOmie) {
        cliente.codigo_cliente_omie = prestadorOmie.codigo_cliente_omie;
        return await clienteService.update(appKey, appSecret, cliente);
      }
      if (!prestadorOmie) {
        cliente.codigo_cliente_integracao = randomUUID();
        return await clienteService.incluir(appKey, appSecret, cliente);
      }
    });

    if (!result && integracao.tentativas < 3) {
      integracao.etapa = "reprocessar";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];

      await integracao.save();
      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "processando",
      });

      return;
    }

    if (!result && integracao.tentativas >= 3) {
      integracao.etapa = "falhas";
      integracao.erros = [
        ...(integracao.erros || []),
        ...(errors?.map((e) => e?.response?.data ?? e?.message) || []),
      ];

      await integracao.save();

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "erro",
      });

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

      await Prestador.findByIdAndUpdate(integracao.prestadorId, {
        status_sincronizacao_omie: "sucesso",
        codigo_cliente_omie: result.codigo_cliente_omie,
      });

      return;
    }
  } catch (err) {
    console.log(err);
    integracao.etapa = "falhas";
    integracao.errors = [
      ...(integracao.errors || []),
      err?.response?.data ?? err?.message,
    ];
    integracao.executadoEm = new Date();
    await integracao.save();

    await Prestador.findByIdAndUpdate(integracao.prestadorId, {
      status_sincronizacao_omie: "erro",
    });
  }
};

const fetchNextIntegracao = async () => {
  const minExecutionTime = new Date(Date.now() - 60 * 1000);

  let integracao = await IntegracaoPrestadorCentralOmie.findOneAndUpdate(
    {
      etapa: "requisicao",
      arquivado: false,
      $or: [
        { executadoEm: { $exists: false } },
        { executadoEm: { $lte: minExecutionTime } },
      ],
    },
    { etapa: "processando", executadoEm: new Date() },
    { sort: { createdAt: 1 }, new: true }
  );

  if (!integracao) {
    integracao = await IntegracaoPrestadorCentralOmie.findOneAndUpdate(
      {
        etapa: "reprocessar",
        arquivado: false,
        $or: [
          { executadoEm: { $exists: false } },
          { executadoEm: { $lte: minExecutionTime } },
        ],
      },
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
