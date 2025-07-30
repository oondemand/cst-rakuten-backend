const Ticket = require("../models/Ticket");
const Servico = require("../models/Servico");
const DocumentoFiscal = require("../models/DocumentoFiscal");

const BaseOmie = require("../models/BaseOmie");
const { consultar } = require("../services/omie/contaPagarService");
const ContaPagar = require("../models/ContaPagar");

const IntegracaoContaPagarService = require("../services/contaPagar");

const obterContaPagarOmie = async (req, res) => {
  try {
    const { codigoLancamento } = req.params;

    const contaPagar = await ContaPagar.findOne({
      codigo_lancamento_omie: codigoLancamento,
    });

    const ticket = await Ticket.findOne({ contaPagarOmie: contaPagar?._id });
    if (!ticket) {
      return res
        .status(404)
        .json({ mensagem: "Ticket com a conta a pagar não encontrado." });
    }

    const baseOmie = await BaseOmie.findOne();

    const { appKey, appSecret } = baseOmie;
    if (!appKey || !appSecret)
      return res
        .status(400)
        .json({ mensagem: "Credenciais Base Omie não encontradas." });

    // Consultar a conta a pagar na Omie usando o serviço de consulta
    const contaPagarOmie = await consultar(appKey, appSecret, codigoLancamento);

    if (!contaPagarOmie) {
      ticket.status = "revisao";
      ticket.etapa = "aprovacao-fiscal";
      ticket.contaPagarOmie = null;
      ticket.observacao = "[CONTA A PAGAR REMOVIDA DO OMIE]";

      await ticket.save();

      await ContaPagar.findOneAndDelete({
        codigo_lancamento_omie: codigoLancamento,
      });

      return res.status(404).json({
        mensagem: `Conta a pagar não encontrada! [${codigoLancamento}]`,
        erro: "CONTA A PAGAR NÃO ENCONTRADA NO OMIE",
      });
    }

    // Verificar se o status do título é "PAGO"
    if (contaPagarOmie.status_titulo === "PAGO") {
      // Alterar o status do ticket para "concluído"

      ticket.status = "concluido";
      ticket.etapa = "concluido";
      await ticket.save();
    }

    contaPagar.status_titulo = contaPagarOmie?.status_titulo;
    await contaPagar.save();

    return res.status(200).json(contaPagarOmie);
  } catch (error) {
    console.error("❌ Erro ao obter conta a pagar Omie:", error);
    return res.status(500).json({
      mensagem: "Erro ao obter conta a pagar Omie.",
      erro: error.message,
    });
  }
};

const contaPagarWebHook = async (req, res) => {
  try {
    const { event, ping, topic } = req.body;
    if (ping === "omie") return res.status(200).json({ message: "pong" });

    // console.log("[EVENT]:", event[0].conta_a_pagar[0]);

    // [EVENT]: [
    //   {
    //     codigo_baixa: 5218765193,
    //     codigo_baixa_integracao: '',
    //     codigo_cliente_fornecedor: 5210003256,
    //     codigo_conta_corrente: 4809215570,
    //     conta_a_pagar: [ [Object] ],
    //     data: '2025-07-29T00:00:00-03:00',
    //     data_cred: '2025-07-29T00:00:00-03:00',
    //     desconto: 0,
    //     juros: 0,
    //     multa: 0,
    //     observacao: '',
    //     tarifa: 0,
    //     valor: 10
    //   }
    // ]

    if (topic === "Financas.ContaPagar.Alterado") {
      console.log("🟩 Conta a pagar alterada");

      const contaPagarOmie = event;

      // const contaPagar = await ContaPagar.findOne({
      //   codigo_lancamento_integracao:
      //     contaPagarOmie.codigo_lancamento_integracao,
      //   codigo_lancamento_omie: contaPagarOmie.codigo_lancamento_omie,
      // });

      // if (!contaPagar) {
      //   return res
      //     .status(200)
      //     .json({ message: "Webhook recebido. Conta pagar não encontrada" });
      // }

      IntegracaoContaPagarService.create.omieCentral({
        tipo: "alterado",
        contaPagar: contaPagarOmie,
        requisicao: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          body: req.body,
        },
      });

      // await ContaPagar.findOneAndUpdate(
      //   {
      //     codigo_lancamento_omie: event?.codigo_lancamento_omie,
      //   },
      //   {
      //     status_titulo: event?.situacao,
      //   },
      //   { new: true }
      // );
    }

    if (topic === "Financas.ContaPagar.BaixaRealizada") {
      console.log("🟨 [RECEBENDO WEBHOOK BAIXA REALIZADA NO OMIE]");

      const contaPagarOmie = event[0].conta_a_pagar[0];

      // const contaPagar = await ContaPagar.findOne({
      //   codigo_lancamento_integracao:
      //     contaPagarOmie.codigo_lancamento_integracao,
      //   codigo_lancamento_omie: contaPagarOmie.codigo_lancamento_omie,
      // });

      // if (!contaPagar) {
      //   return res
      //     .status(200)
      //     .json({ message: "Webhook recebido. Conta pagar não encontrada" });
      // }

      IntegracaoContaPagarService.create.omieCentral({
        tipo: "baixa-realizada",
        contaPagar: contaPagarOmie,
        requisicao: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          body: req.body,
        },
      });

      // const contaPagar = await ContaPagar.findOneAndUpdate(
      //   {
      //     codigo_lancamento_omie:
      //       event?.[0]?.conta_a_pagar[0].codigo_lancamento_omie,
      //   },
      //   { ...event?.[0]?.conta_a_pagar[0], status_titulo: "pago" },
      //   { new: true }
      // );
      // const ticket = await Ticket.findOneAndUpdate(
      //   {
      //     contaPagarOmie: contaPagar?._id,
      //   },
      //   {
      //     status: "concluido",
      //     etapa: "concluido",
      //   },
      //   { new: true }
      // );
      // if (ticket?.servicos.length > 0) {
      //   await Servico.updateMany(
      //     { _id: { $in: ticket?.servicos } },
      //     { status: "pago" }
      //   );
      // }
      // if (ticket?.documentosFiscais.length > 0) {
      //   await DocumentoFiscal.updateMany(
      //     { _id: { $in: ticket?.documentosFiscais } },
      //     { status: "pago" }
      //   );
      // }
    }

    if (topic === "Financas.ContaPagar.BaixaCancelada") {
      const contaPagarOmie = event[0].conta_a_pagar[0];

      // const contaPagar = await ContaPagar.findOne({
      //   codigo_lancamento_integracao:
      //     contaPagarOmie.codigo_lancamento_integracao,
      //   codigo_lancamento_omie: contaPagarOmie.codigo_lancamento_omie,
      // });

      // if (!contaPagar) {
      //   return res
      //     .status(200)
      //     .json({ message: "Webhook recebido. Conta pagar não encontrada" });
      // }

      IntegracaoContaPagarService.create.omieCentral({
        tipo: "baixa-cancelada",
        contaPagar: contaPagarOmie,
        requisicao: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          body: req.body,
        },
      });

      // console.log("🟧 Baixa cancelada no omie");
      // const contaPagar = await ContaPagar.findOneAndUpdate(
      //   {
      //     codigo_lancamento_omie:
      //       event?.[0]?.conta_a_pagar[0].codigo_lancamento_omie,
      //   },
      //   { ...event?.[0]?.conta_a_pagar[0], status_titulo: "A vencer" },
      //   { new: true }
      // );
      // const ticket = await Ticket.findOneAndUpdate(
      //   {
      //     contaPagarOmie: contaPagar?._id,
      //   },
      //   {
      //     status: "trabalhando",
      //     etapa: "integracao-omie",
      //   },
      //   { new: true }
      // );
      // if (ticket?.servicos.length > 0) {
      //   await Servico.updateMany(
      //     { _id: { $in: ticket?.servicos } },
      //     { status: "processando" }
      //   );
      // }
      // if (ticket?.documentosFiscais.length > 0) {
      //   await DocumentoFiscal.updateMany(
      //     { _id: { $in: ticket?.documentosFiscais } },
      //     { status: "processando" }
      //   );
      // }
    }

    if (topic === "Financas.ContaPagar.Excluido") {
      const contaPagarOmie = event;

      // const contaPagar = await ContaPagar.findOne({
      //   codigo_lancamento_integracao:
      //     contaPagarOmie.codigo_lancamento_integracao,
      //   codigo_lancamento_omie: contaPagarOmie.codigo_lancamento_omie,
      // });

      // if (!contaPagar) {
      //   return res
      //     .status(200)
      //     .json({ message: "Webhook recebido. Conta pagar não encontrada" });
      // }

      IntegracaoContaPagarService.create.omieCentral({
        tipo: "excluido",
        contaPagar: contaPagarOmie,
        requisicao: {
          url: `${req.protocol}://${req.get("host")}${req.originalUrl}`,
          body: req.body,
        },
      });
      // console.log("🟥 Conta pagar excluída no omie");
      // const contaPagar = await ContaPagar.findOneAndDelete({
      //   codigo_lancamento_omie: event?.codigo_lancamento_omie,
      // });
      // const ticket = await Ticket.findOneAndUpdate(
      //   {
      //     contaPagarOmie: contaPagar?._id,
      //   },
      //   {
      //     status: "revisao",
      //     etapa: "aprovacao-fiscal",
      //     contaPagarOmie: null,
      //     observacao: "[CONTA A PAGAR REMOVIDA DO OMIE]",
      //   },
      //   { new: true }
      // );
      // if (ticket?.servicos.length > 0) {
      //   await Servico.updateMany(
      //     { _id: { $in: ticket?.servicos } },
      //     { status: "processando" }
      //   );
      // }
      // if (ticket?.documentosFiscais.length > 0) {
      //   await DocumentoFiscal.updateMany(
      //     { _id: { $in: ticket?.documentosFiscais } },
      //     { status: "processando" }
      //   );
      // }
    }

    res.status(200).json({ message: "Webhook recebido." });
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    res.status(500).json({ error: "Erro ao processar o webhook." });
  }
};

module.exports = { obterContaPagarOmie, contaPagarWebHook };
