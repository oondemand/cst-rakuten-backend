const Importacao = require("../../models/Importacao");
const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const Servico = require("../../models/Servico");
const Lista = require("../../models/Lista");
const { CNPJouCPF } = require("../../utils/formatters");
const emailUtils = require("../../utils/emailUtils");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

const converterLinhaEmServico = async ({ row }) => {
  const { numero, tipo } = await CNPJouCPF(row[2]);
  const competencia = row[7];

  const servico = {
    prestador: {
      nome: row[0],
      sid: row[1],
      documento: numero,
      tipo,
    },
    tipoDocumentoFiscal: row[3]?.toUpperCase(),
    dataProvisaoContabil: row[4],
    dataRegistro: row[5],
    campanha: row[6],
    competencia: {
      mes: competencia && competencia.getMonth() + 1,
      ano: competencia && competencia.getFullYear(),
    },

    valores: {
      grossValue: arredondarValor(row[8]),
      bonus: arredondarValor(row[9]),
      ajusteComercial: arredondarValor(row[10]),
      paidPlacement: arredondarValor(row[11]),

      revisionMonthProvision: row[13],

      revisionGrossValue: arredondarValor(row[14]),
      revisionProvisionBonus: arredondarValor(row[15]),
      revisionComissaoPlataforma: arredondarValor(row[16]),
      revisionPaidPlacement: arredondarValor(row[17]),
    },
  };

  return servico;
};

const buscarServicoExistente = async ({ prestadorId, competencia }) => {
  if (!prestadorId || !competencia) return null;
  const servico = await Servico.findOne({
    prestador: prestadorId,
    "competencia.mes": competencia?.mes,
    "competencia.ano": competencia?.ano,
  });

  return servico;
};

const buscarPrestadorPorSid = async ({ sid }) => {
  if (!sid) return null;
  return await Prestador.findOne({ sid });
};

const criarNovoPrestador = async ({ sid, nome, tipo, documento }) => {
  const prestador = new Prestador({
    sid,
    nome,
    tipo,
    documento,
    status: "em-analise",
  });

  await prestador.save();
  return prestador;
};

const criarNovoUsuario = async ({ nome, email }) => {
  const usuario = await Usuario.findOne({ email });

  if (!usuario) {
    const novoUsuario = new Usuario({
      email: email,
      nome: nome,
      tipo: "prestador",
      senha: "123456",
    });

    return await novoUsuario.save();
  }

  return usuario;
};

const criarNovoServico = async (servico) => {
  const novoServico = new Servico({
    ...servico,
    status: "aberto",
  });

  await novoServico.save();
};

const criarNovaCampanha = async ({ campanha }) => {
  const campanhas = await Lista.findOne({ codigo: "campanha" });
  const campanhaExistente = campanhas.valores.some(
    (e) => e?.valor.trim() === campanha.trim()
  );

  if (!campanhaExistente && campanha !== "") {
    campanhas.valores.push(campanha.trim());
    await campanhas.save();
  }
};

const processarJsonServicos = async ({ json }) => {
  const detalhes = {
    totalDeLinhasLidas: json.length - 1,
    linhasLidasComErro: 0,
    novosPrestadores: 0,
    novosServicos: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const [i, row] of json.entries()) {
    try {
      if (i === 0) {
        arquivoDeErro.push(row);
        continue;
      }

      const servico = await converterLinhaEmServico({ row });
      let prestador = await buscarPrestadorPorSid({
        sid: servico?.prestador?.sid,
      });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          sid: servico?.prestador?.sid,
          documento: servico?.prestador?.documento,
          nome: servico?.prestador?.nome,
          tipo: servico?.prestador?.tipo,
        });

        detalhes.novosPrestadores += 1;
      }

      if (prestador.email && !prestador.usuario) {
        const usuario = await criarNovoUsuario({
          email: prestador?.email,
          nome: prestador?.nome,
        });

        prestador.usuario = usuario._id;
        await prestador.save();
      }

      const servicoExistente = await buscarServicoExistente({
        competencia: servico?.competencia,
        prestadorId: prestador?._id,
      });

      // Atualiza o serviço caso já exista
      if (servicoExistente) {
        servicoExistente.valores = servico.valores;
        servicoExistente.tipoDocumentoFiscal = servico.tipoDocumentoFiscal;

        await servicoExistente.save();
      }

      await criarNovaCampanha({ campanha: servico?.campanha });

      if (!servicoExistente) {
        await criarNovoServico({ ...servico, prestador: prestador?._id });
        detalhes.novosServicos += 1;
      }
    } catch (error) {
      console.log("ERROR", error);
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [SID: ${row[1]} - PRESTADOR: ${row[0]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarServico = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "servico",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonServicos({ json });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();

    await emailUtils.importarServicoDetalhes({
      detalhes,
      usuario: req.usuario,
    });

    console.log("[EMAIL ENVIADO PARA]:", req.usuario.email);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ouve um erro ao importar arquivo" });
  }
};
