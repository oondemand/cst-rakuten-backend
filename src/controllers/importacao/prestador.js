const Importacao = require("../../models/Importacao");
const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const Servico = require("../../models/Servico");
const Lista = require("../../models/Lista");
const { CNPJouCPF } = require("../../utils/formatters");
const emailUtils = require("../../utils/emailUtils");
const { parse } = require("date-fns");

const {
  arrayToExcelBuffer,
  arredondarValor,
  excelToJson,
} = require("../../utils/excel.js");

const { LISTA_PAISES_OMIE } = require("../../utils/omie.js");

const criarNovoManager = async ({ manager }) => {
  const managers = await Lista.findOne({ codigo: "manager" });
  const managerExistente = managers.valores.some(
    (e) => e?.valor?.trim() === manager?.trim()
  );

  if (!managerExistente) {
    managers.valores.push({ valor: manager?.trim() });
    await managers.save();
  }
};

const converterLinhaEmPrestador = async ({ row }) => {
  const { numero } = await CNPJouCPF(row[5]);

  const pais = LISTA_PAISES_OMIE.find(
    (e) => e.cDescricao.toLowerCase() === row[17].toLowerCase()
  );

  const prestador = {
    sciUnico: row[0],
    manager: row[1],
    nome: row[2],
    sid: row[3],
    tipo: row[4],
    documento: numero,
    dadosBancarios: {
      banco: row[6],
      agencia: row[7],
      conta: row[8],
      tipoConta: row[9],
    },
    email: row[10] === "" ? null : row[10],
    endereco: {
      cep: row[11].replaceAll("-", ""),
      rua: row[12],
      numero: row[13],
      complemento: row[14],
      cidade: row[15],
      estado: row[16],
      pais: { nome: pais?.cDescricao, cod: pais?.cCodigo },
    },
    pessoaFisica: {
      dataNascimento:
        row[18] !== ""
          ? parse(row[18].replace(/[^\w\/]/g, ""), "dd/MM/yyyy", new Date())
          : null,
      pis: row[19],
    },
    pessoaJuridica: { nomeFantasia: row[20] },
  };

  return prestador;
};

const criarNovoPrestador = async ({ prestador }) => {
  const novoPrestador = new Prestador({
    ...prestador,
    status: "em-analise",
  });

  await novoPrestador.save();
  return novoPrestador;
};

const buscarPrestadorPorSidEAtualizar = async ({ sid, prestador }) => {
  if (sid || prestador) return null;
  return await Prestador.findOneAndUpdate({ sid: sid }, prestador);
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

const processarJsonPrestadores = async ({ json }) => {
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
      const prestadorObj = await converterLinhaEmPrestador({ row });

      let prestador = await buscarPrestadorPorSidEAtualizar({
        sid: prestadorObj?.sid,
        prestador: prestadorObj,
      });

      await criarNovoManager({ manager: prestadorObj?.manager });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          prestador: prestadorObj,
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
    } catch (error) {
      console.log("ERROR", error);
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [SID: ${row[3]} - PRESTADOR: ${row[2]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarPrestador = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "prestador",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonPrestadores({
      json,
    });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();

    await emailUtils.importarPrestadorDetalhes({
      detalhes,
      usuario: req.usuario,
    });

    console.log("[EMAIL ENVIADO PARA]:", req.usuario.email);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Ouve um erro ao importar arquivo" });
  }
};
