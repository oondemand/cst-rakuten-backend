const sgMail = require("@sendgrid/mail");
const Usuario = require("../models/Usuario"); // Certifique-se de que o modelo de usuário está corretamente importado

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const enviarEmail = async (emailFrom, emailTo, assunto, corpo, anexos = []) => {
  const message = {
    from: {
      email: emailFrom.email,
      name: emailFrom.nome,
    },
    personalizations: [
      {
        to: [
          {
            email: emailTo.email,
            name: emailTo.nome,
          },
        ],
        subject: assunto,
      },
    ],
    content: [
      {
        type: "text/html",
        value: corpo,
      },
    ],
    attachments: anexos.map(({ filename, fileBuffer }) => ({
      content: fileBuffer.toString("base64"),
      filename: filename,
      disposition: "attachment",
    })),
  };

  console.log("message", JSON.stringify(message, null, 2));

  try {
    const retorno = await sgMail.send(message);
    console.log("retorno", retorno);
    return retorno;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
};

const confirmacaoEmailPrestador = async (usuarioId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const confirmacaoPrestadorUrl = process.env.CONFIRMACAO_PRESTADOR_URL;
    const token = usuario.gerarToken();

    const emailFrom = {
      email: "fabio@oondemand.com.br",
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Confirme seu e-mail";

    // Template do corpo do e-mail com o link de confirmação
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Clique no link abaixo para confirmar seu e-mail:</p>
    <a href="${confirmacaoPrestadorUrl}?token=${token}">Confirmar e-mail</a>`;

    await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    console.error("Erro ao enviar e-mail de confirmação:", error);
    throw new Error("Erro ao enviar e-mail de confirmação");
  }
};

const emailEsqueciMinhaSenha = async ({ usuario, url }) => {
  try {
    const emailFrom = {
      email: "fabio@oondemand.com.br",
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Recuperação de senha";

    // Template do corpo do e-mail com o link para recuperação de senha
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Clique no link abaixo darmos inicio ao processo de recuperação de senha:</p>
    <a href="${url}">Recuperar minha senha</a>`;

    await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    console.error("Erro ao enviar e-mail para recuperação de senha:", error);
    throw new Error("Erro ao enviar e-mail para recuperação de senha");
  }
};

const importarComissõesDetalhes = async ({ usuario, detalhes }) => {
  try {
    const emailFrom = {
      email: "fabio@oondemand.com.br",
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Detalhes de importação de comissões";

    // Template do corpo do e-mail com o link para recuperação de senha
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Segue o relatório sobre a importação de comissões:</p>
    <p>Linhas lidas: ${detalhes.linhasEncontradas}</p>
    <p>Linhas com erro: ${detalhes.linhasLidasComErro}</p>
    <p>Linhas com sucesso: ${detalhes.linhasEncontradas - detalhes.linhasLidasComErro}</p>
    <p>Total de serviços criados: ${detalhes.linhasEncontradas - detalhes.linhasLidasComErro}</p>
    <p>Total novos prestadores criados: ${detalhes.totalDeNovosPrestadores}</p>
    <p>Total de novos tickets criados: ${detalhes.totalDeNovosTickets}</p>
    <p>Valor total lido: ${detalhes.valorTotalLido.toFixed(2).replace(".", ",")}</p>`;

    console.log(corpo);

    const arquivoDeErros = Buffer.from(detalhes.erros).toString("base64");
    const anexos = [
      {
        content: arquivoDeErros,
        filename: "arquivo.txt",
        type: "text/plain",
        disposition: "attachment",
      },
    ];

    if (process.env.NODE_ENV !== "development") {
      await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
    }
  } catch (error) {
    console.error(
      "Erro ao enviar e-mail para detalhes de importação de comissões:",
      error,
    );
    throw new Error(
      "Erro ao enviar e-mail para detalhes de importação de comissões",
    );
  }
};

module.exports = {
  confirmacaoEmailPrestador,
  emailEsqueciMinhaSenha,
  importarComissõesDetalhes,
};
