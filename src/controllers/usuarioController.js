// backend/controllers/UsuarioController.js

const Usuario = require("../models/Usuario");
const bcrypt = require("bcryptjs");
const emailUtils = require("../utils/emailUtils");
const jwt = require("jsonwebtoken");

exports.seedUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes } = req.body;
  try {
    // Verifica se há algum usuário ativo no banco de dados
    const usuarioAtivo = await Usuario.findOne({ status: "ativo" });

    if (usuarioAtivo) {
      return res
        .status(400)
        .json({ error: "Já existe um usuário ativo no sistema" });
    }

    // Cria um novo usuário se não houver nenhum usuário ativo
    const novoUsuario = new Usuario({ nome, email, senha, status, permissoes });
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
};

// Função para registrar um novo usuário tipo prestador
exports.registrarUsuarioPrestador = async (req, res) => {
  const { nome, email, senha } = req.body;
  try {
    // Verificar se o e-mail já está cadastrado
    const usuarioExistente = await Usuario.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ mensagem: "E-mail já cadastrado" });
    }

    const novoUsuario = new Usuario({
      nome,
      email,
      senha,
      status: "email-nao-confirmado",
      tipo: "prestador",
    });
    await novoUsuario.save();

    // Enviar e-mail de confirmação
    await emailUtils.confirmacaoEmailPrestador(novoUsuario);

    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
};

exports.registrarUsuario = async (req, res) => {
  const { nome, email, senha, status, permissoes } = req.body;
  try {
    const novoUsuario = new Usuario({ nome, email, senha, status, permissoes });
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao registrar usuário" });
  }
};

exports.loginUsuario = async (req, res) => {
  const { email, senha } = req.body;
  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario)
      return res.status(404).json({ mensagem: "Usuário não encontrado" });

    if (usuario.status === "arquivado")
      return res.status(404).json({ mensagem: "Usuário não encontrado" });

    if (!(await bcrypt.compare(senha, usuario.senha)))
      return res.status(401).json({ mensagem: "Credenciais inválidas" });

    if (usuario.status === "ativo") {
      const token = usuario.gerarToken();
      res.json({
        token,
        usuario: {
          _id: usuario._id,
          nome: usuario.nome,
          tipo: usuario.tipo,
        },
      });
    } else if (usuario.status === "email-nao-confirmado") {
      res
        .status(401)
        .json({ mensagem: "E-mail não confirmado", status: usuario.status });
    } else {
      const msg = {
        mensagem: "O usuário não está ativo",
        status: usuario.status,
      };
      res.status(401).json(msg);
    }
  } catch (error) {
    res
      .status(400)
      .json({ mensagem: "Erro ao fazer login", detalhes: error.message });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find();
    res.json(usuarios);
  } catch (error) {
    res.status(400).json({ error: "Erro ao listar usuários" });
  }
};

exports.obterUsuario = async (req, res) => {
  console.log(req.params.id);
  try {
    const usuario = await Usuario.findById(req.params.id);
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(usuario);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Erro ao obter usuário" });
  }
};

exports.atualizarUsuario = async (req, res) => {
  const { nome, email, status, permissoes } = req.body;
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      { nome, email, status, permissoes },
      { new: true },
    );
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });
    res.json(usuario);
  } catch (error) {
    res.status(400).json({ error: "Erro ao atualizar usuário" });
  }
};

exports.excluirUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: "Erro ao excluir usuário" });
  }
};

// Função para validar o token e retornar os dados do usuário
exports.validarToken = async (req, res) => {
  try {
    // Se o middleware `protect` passou, `req.usuario` já está preenchido
    res.json(req.usuario);
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

// Função para confirmar o e-mail do prestador
exports.confirmarEmail = async (req, res) => {
  const { token } = req.body; // Espera-se que o token seja enviado no corpo da requisição

  if (!token)
    return res
      .status(400)
      .json({ error: "Token de confirmação é obrigatório." });

  try {
    // Decodificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Encontrar o usuário pelo ID decodificado
    const usuario = await Usuario.findById(decoded.id);

    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado." });

    if (usuario.status !== "email-nao-confirmado")
      return res
        .status(400)
        .json({ error: "E-mail já confirmado ou status inválido." });

    // Atualizar o status do usuário para "ativo"
    usuario.status = "ativo";
    await usuario.save();

    res.json({ message: "E-mail confirmado com sucesso." });
  } catch (error) {
    console.error("Erro ao confirmar e-mail:", error);
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Token de confirmação expirado." });
    }
    res.status(400).json({ error: "Token de confirmação inválido." });
  }
};

exports.esqueciMinhaSenha = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(404)
      .json({ error: "Não foi encontrado um usuário com esse email" });
  }

  try {
    const usuario = await Usuario.findOne({ email });

    if (!usuario)
      return res.status(404).json({ message: "Usuário não encontrado" });

    if (usuario.status === "arquivado")
      return res.status(404).json({ message: "Usuário não encontrado" });

    if (usuario.status === "ativo") {
      const token = usuario.gerarToken();

      const url = new URL("/update-password", process.env.CLIENT_BASE_URL);
      url.searchParams.append("code", token);

      //mostra url para não ter que verificar no email
      console.log("URL", url.toString());

      if (process.env.NODE_ENV !== "development") {
        await emailUtils.emailEsqueciMinhaSenha({
          usuario,
          url: url.toString(),
        });
      }

      res.status(200).json({ message: "Email enviado" });
    }
  } catch (error) {
    console.log(error);

    res.status(404).json({ error: "Usuário não encontrado" });
  }
};

exports.alterarSenha = async (req, res) => {
  const { code } = req.query;

  const token = req.headers.authorization?.split(" ")[1];
  const { novaSenha, confirmacao } = req.body;

  if (!token && !code) {
    return res.status(401).json({ error: "Token inválido" });
  }

  if (code) {
    if (!novaSenha) {
      return res
        .status(404)
        .json({ error: "Nova senha é um campo obrigatório" });
    }

    if (!confirmacao) {
      return res
        .status(404)
        .json({ error: "Confirmação é um compo obrigatório" });
    }

    if (novaSenha !== confirmacao) {
      return res
        .status(400)
        .json({ error: "A confirmação precisa ser igual a senha." });
    }
    try {
      const decoded = jwt.verify(code, process.env.JWT_SECRET);
      const usuario = await Usuario.findById(decoded.id).select("-senha");
      usuario.senha = novaSenha;
      await usuario.save();
      return res.status(200).json({ message: "Senha atualizada com sucesso." });
    } catch (error) {
      return res.status(401).json({ error: "Token inválido." });
    }
  }

  return res.status(200).json({ message: "Não configurado ainda" });
};
