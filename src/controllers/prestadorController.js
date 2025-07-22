// src/controllers/prestadorController.js
const Prestador = require("../models/Prestador");
const Ticket = require("../models/Ticket");
const {
  sincronizarPrestador,
} = require("../services/omie/sincronizarPrestador");
const filtersUtils = require("../utils/filter");
const Usuario = require("../models/Usuario");
const Servico = require("../models/Servico");
const DocumentoFiscal = require("../models/DocumentoFiscal");
const IntegracaoPrestadorService = require("../services/IntegracaoPrestador");

// Método para obter prestador pelo idUsuario
exports.obterPrestadorPorIdUsuario = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      usuario: req.params.idUsuario,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res
      .status(400)
      .json({ error: "Erro ao obter prestador", detalhes: error.message });
  }
};

// obter prestador pelo sid
exports.obterPrestadorPorSid = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({ sid: req.params.sid });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.adicionarPrestadorECriarTicket = async (req, res) => {
  // console.log("adicionarPrestadorECriarTicket", req.body);

  try {
    // Adicionar prestador
    const novoPrestador = new Prestador(req.body);
    novoPrestador.status = "ativo";
    await novoPrestador.save();

    // console.log("novoPrestador", novoPrestador);

    // Criar ticket
    const novoTicket = new Ticket({
      titulo: `Novo Prestador: ${novoPrestador.nome}`,
      etapa: "requisicao",
      status: "aguardando-inicio",
      prestador: novoPrestador._id,
    });
    await novoTicket.save();

    // console.log("novoTicket", novoTicket);

    res.status(201).json({
      message: "Prestador adicionado e ticket criado com sucesso!",
      prestador: novoPrestador,
      ticket: novoTicket,
    });
  } catch (error) {
    // console.error("Erro ao adicionar prestador e criar ticket:", error);
    res.status(500).json({
      message: "Erro ao adicionar prestador e criar ticket",
      detalhes: error.message,
    });
  }
};

// Criar um novo Prestador
exports.criarPrestador = async (req, res) => {
  try {
    const { email, ...rest } = req.body;
    const data = email === "" ? rest : req.body;

    if (req.body?.sid) {
      const prestador = await Prestador.findOne({
        sid: req.body.sid,
      });

      if (prestador) {
        return res.status(409).json({
          message: "Já existe um prestador com esse sid registrado",
        });
      }
    }

    if (req.body?.sciUnico) {
      const prestador = await Prestador.findOne({
        sciUnico: req.body.sciUnico,
      });

      if (prestador) {
        return res.status(409).json({
          message: "Já existe um prestador com esse sciUnico registrado",
        });
      }
    }

    // if (req.body?.documento) {
    //   const prestador = await Prestador.findOne({
    //     documento: req.body.documento,
    //   });

    //   if (prestador) {
    //     return res.status(409).json({
    //       message: "Já existe um prestador com esse documento registrado",
    //     });
    //   }
    // }

    const prestador = new Prestador(data);
    await prestador.save();

    res.status(201).json({
      message: "Prestador criado com sucesso!",
      prestador,
    });
  } catch (error) {
    console.error("Erro ao criar prestador:", error);
    res.status(500).json({
      message: "Erro ao criar prestador",
      detalhes: error.message,
    });
  }
};

// Listar todos os Prestadores
exports.listarPrestadores = async (req, res) => {
  try {
    const { sortBy, pageIndex, pageSize, searchTerm, ...rest } = req.query;

    const schema = Prestador.schema;

    const camposBusca = [
      "sciUnico",
      "manager",
      "nome",
      "sid",
      "documento",
      "dadosBancariosSchema.agencia",
      "dadosBancariosSchema.conta",
      "email",
      "cep",
      "enderecoSchema.rua",
      "enderecoSchema.numero",
      "enderecoSchema.complemento",
      "enderecoSchema.cidade",
      "pessoaFisica.dataNascimento",
      "pessoaFisica.pis",
      "pessoaJuridica.nomeFantasia",
      "createdAt",
      "updatedAt",
    ];

    const queryResult = filtersUtils.buildQuery({
      filtros: rest,
      searchTerm,
      schema,
      camposBusca,
    });

    let sorting = {};

    if (sortBy) {
      const [campo, direcao] = sortBy.split(".");
      const campoFormatado = campo.replaceAll("_", ".");
      sorting[campoFormatado] = direcao === "desc" ? -1 : 1;
    }

    const page = parseInt(pageIndex) || 0;
    const limit = parseInt(pageSize) || 10;

    const prestadores = await Prestador.find(queryResult)
      .sort(sorting)
      .skip(page * limit)
      .limit(limit);

    const totalDePrestadores = await Prestador.countDocuments(queryResult);

    const totalPages = Math.ceil(totalDePrestadores / limit);

    const response = {
      prestadores,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalDePrestadores,
        itemsPerPage: limit,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    // console.log("ERROR", error);
    res.status(400).json({ error: "Erro ao listar prestadores" });
  }
};

// Obter um Prestador por ID
exports.obterPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id);
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(400).json({ error: "Erro ao obter prestador" });
  }
};

// Atualizar um Prestador
exports.atualizarPrestador = async (req, res) => {
  try {
    const prestador = await Prestador.findById(req.params.id).populate(
      "usuario"
    );

    if (!prestador)
      return res.status(404).json({ message: "Prestador não encontrado" });

    if (req.body.sid) {
      const prestadorSid = await Prestador.findOne({
        sid: req.body.sid,
      });

      if (
        prestadorSid &&
        prestador._id.toString() !== prestadorSid._id.toString()
      ) {
        return res.status(409).json({
          message: "Já existe um prestador com esse sid registrado",
        });
      }
    }

    if (req.body.sciUnico) {
      const prestadorSciUnico = await Prestador.findOne({
        sciUnico: req.body.sciUnico,
      });

      if (
        prestadorSciUnico &&
        prestador._id.toString() !== prestadorSciUnico._id.toString()
      ) {
        return res.status(409).json({
          message: "Já existe um prestador com esse sciUnico registrado",
        });
      }
    }

    // if (req.body.documento) {
    //   const prestadorDocumento = await Prestador.findOne({
    //     documento: req.body.documento,
    //   });

    //   if (
    //     prestadorDocumento &&
    //     prestador._id.toString() !== prestadorDocumento._id.toString()
    //   ) {
    //     return res.status(409).json({
    //       message: "Já existe um prestador com esse documento registrado",
    //     });
    //   }
    // }

    if (req?.body?.email) {
      const prestadorEmail = await Prestador.findOne({
        email: req.body.email,
      });

      if (
        prestadorEmail &&
        prestadorEmail?._id?.toString() !== prestador._id.toString()
      ) {
        return res.status(409).json({
          message: "Já existe um prestador com esse email registrado",
        });
      }

      if (prestador?.usuario) {
        const usuario = await Usuario.findOne({ email: req.body.email });

        if (
          usuario &&
          usuario?._id?.toString() !== prestador.usuario._id.toString()
        ) {
          return res.status(409).json({
            message: "Já existe um usuário prestador com esse email registrado",
          });
        }

        prestador.usuario.email = req.body.email;
        await prestador.usuario.save();
      }
    }

    const prestadorAtualizado = await Prestador.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status_sincronizacao_omie: "processando" },
      {
        new: true,
      }
    );

    await IntegracaoPrestadorService.create({
      prestador: prestadorAtualizado,
    });

    res.status(200).json({
      message: "Prestador atualizado com sucesso!",
      prestador: prestadorAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar prestador:", error);
    res.status(500).json({
      message: "Erro ao atualizar prestador",
      detalhes: error.message,
    });
  }
};

// Excluir um Prestador
exports.excluirPrestador = async (req, res) => {
  try {
    const associacoes = [
      { model: Ticket, nome: "ticket" },
      { model: Servico, nome: "serviço" },
      { model: DocumentoFiscal, nome: "documento fiscal" },
    ];

    for (const { model, nome } of associacoes) {
      const associacao = await model.findOne({ prestador: req.params.id });
      if (associacao) {
        return res.status(400).json({
          message: `Não foi possível excluir o prestador, pois ele está associado a um ${nome}.`,
        });
      }
    }

    const prestador = await Prestador.findByIdAndDelete(req.params.id);

    if (prestador?.usuario) {
      await Usuario.findByIdAndDelete(prestador?.usuario);
    }

    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir prestador" });
  }
};

exports.obterPrestadorPorDocumento = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      documento: req.params.documento,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.obterPrestadorPorEmail = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      email: req.params.email,
    });
    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.obterPrestadorPorPis = async (req, res) => {
  try {
    const prestador = await Prestador.findOne({
      "pessoaFisica.pis": req.params.pis,
    });

    if (!prestador)
      return res.status(404).json({ error: "Prestador não encontrado" });
    res.status(200).json(prestador);
  } catch (error) {
    res.status(500).json({
      message: "Erro ao obter prestador",
      detalhes: error.message,
    });
  }
};

exports.prestadorWebHook = async (req, res) => {
  try {
    const { event, ping, topic } = req.body;
    if (ping === "omie") return res.status(200).json({ message: "pong" });

    // if (topic === "ClienteFornecedor.Adicionado") {
    //   console.log("🟨 Prestador adicionado", event);
    // }

    // if (topic === "ClienteFornecedor.Alterado") {
    //   console.log("🟩 Prestador alterado");

    //   const documento = event?.cnpj_cpf
    //     ? Number(event.cnpj_cpf.replace(/[.\-\/]/g, ""))
    //     : null;

    //   const prestadorOmie = {
    //     nome: event.razao_social,
    //     tipo:
    //       event?.exterior === "S"
    //         ? "ext"
    //         : event?.pessoa_fisica === "S"
    //           ? "pf"
    //           : "pj",
    //     documento,
    //     codigo_cliente_omie: event?.codigo_cliente_omie,
    //     dadosBancarios: {
    //       banco: event?.dadosBancarios?.codigo_banco ?? "",
    //       agencia: event?.dadosBancarios?.agencia ?? "",
    //       conta: event?.dadosBancarios?.conta_corrente ?? "",
    //     },
    //     email: event?.email,
    //     endereco: {
    //       cep: event?.cep ?? "",
    //       rua: event?.endereco ?? "",
    //       numero: event?.endereco_numero ? Number(event?.endereco_numero) : "",
    //       complemento: event?.complemento ?? complemento,
    //       cidade: event?.cidade ?? "",
    //       estado: event?.estado ?? "",
    //     },
    //   };

    //   const prestador = await Prestador.findOne({
    //     $or: [
    //       { documento },
    //       { email: event?.email },
    //       { codigo_cliente_omie: event.codigo_cliente_omie },
    //     ],
    //   }).populate("usuario");

    //   if (prestador) {
    //     if (documento) {
    //       const prestadorDocumento = await Prestador.findOne({
    //         documento: documento,
    //       });

    //       if (
    //         prestadorDocumento &&
    //         prestador._id.toString() !== prestadorDocumento._id.toString()
    //       ) {
    //         return res.status(409).json({
    //           message: "Já existe um prestador com esse documento registrado",
    //         });
    //       }
    //     }

    //     if (prestadorOmie?.email) {
    //       const prestadorEmail = await Prestador.findOne({
    //         email: prestadorOmie?.email,
    //       });

    //       if (
    //         prestadorEmail &&
    //         prestadorEmail?._id?.toString() !== prestador._id.toString()
    //       ) {
    //         return res.status(409).json({
    //           message: "Já existe um prestador com esse email registrado",
    //         });
    //       }

    //       if (prestador?.usuario) {
    //         const usuario = await Usuario.findOne({
    //           email: prestadorOmie?.email,
    //         });

    //         if (
    //           usuario &&
    //           usuario?._id?.toString() !== prestador.usuario._id.toString()
    //         ) {
    //           return res.status(409).json({
    //             message:
    //               "Já existe um usuário prestador com esse email registrado",
    //           });
    //         }

    //         prestador.usuario.email = prestadorOmie?.email;
    //         await prestador.usuario.save();
    //       }
    //     }

    //     await Prestador.findByIdAndUpdate(prestador._id, {
    //       ...prestadorOmie,
    //     });

    //     res
    //       .status(200)
    //       .json({ message: "Webhook recebido. Dados sendo atualizados." });
    //   }
    // }
  } catch (error) {
    console.error("Erro ao processar o webhook:", error);
    res.status(500).json({ error: "Erro ao processar o webhook." });
  }
};
