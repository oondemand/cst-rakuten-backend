const sgMail = require("@sendgrid/mail");
const { format } = require("date-fns");
const Usuario = require("../models/Usuario");

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

  // console.log("message", JSON.stringify(message, null, 2));

  try {
    const retorno = await sgMail.send(message);
    return retorno;
  } catch (error) {
    // console.error("Erro ao enviar e-mail:", error);
    throw new Error("Erro ao enviar e-mail");
  }
};

const confirmacaoEmailPrestador = async (usuarioId) => {
  try {
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const confirmacaoPrestadorUrl = process.env.BASE_URL_CST;
    const token = usuario.gerarToken();

    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
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
    <a href="${confirmacaoPrestadorUrl}/confirmar-email?token=${token}">Confirmar e-mail</a>`;

    await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de confirmação:", error);
    throw new Error("Erro ao enviar e-mail de confirmação");
  }
};

const emailEsqueciMinhaSenha = async ({ usuario, url }) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
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
    // console.error("Erro ao enviar e-mail para recuperação de senha:", error);
    throw new Error("Erro ao enviar e-mail para recuperação de senha");
  }
};

const emailPrestadoresExportados = async ({
  usuario,
  documento,
  prestadoresExportados,
}) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Prestadores exportados";

    // Template do corpo do e-mail com o link de confirmação
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Exportação concluída foram exportados ${prestadoresExportados} novos prestadores!</p>
    <p>Segue em anexo o arquivo com prestadores exportados!</p>`;

    const arquivoExportado = Buffer.from(documento).toString("base64");
    const anexos = [
      {
        filename: `prestadores-${format(new Date(), "dd-MM-yyy")}.txt`,
        fileBuffer: arquivoExportado,
      },
    ];

    return await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de prestadores exportados:", error);
    throw new Error("Erro ao enviar e-mail de prestadores exportados:");
  }
};

const emailServicosExportados = async ({
  usuario,
  documento,
  servicosExportados,
}) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Serviços exportados";

    // Template do corpo do e-mail com o link de confirmação
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Foram exportados ${servicosExportados} serviços!</p>
    <p>Segue em anexo o arquivo com serviços exportados!</p>`;

    const arquivoExportado = Buffer.from(documento).toString("base64");
    const anexos = [
      {
        filename: `servicos-${format(new Date(), "dd-MM-yyy")}.txt`,
        fileBuffer: arquivoExportado,
      },
    ];

    return await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de serviços exportados:", error);
    throw new Error("Erro ao enviar e-mail de serviços exportados:");
  }
};

const emailImportarRpas = async ({ usuario, detalhes }) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "RPAs importadas";

    // Template do corpo do e-mail com o link de confirmação
    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Foram importados ${detalhes.sucesso} arquivos.</p>
    <p>Arquivos com erro ${detalhes.erros.quantidade} arquivos.</p>
    ${detalhes.erros.quantidade > 0 ? "<p>Segue em anexo o log de erros</p>" : ""}
    `;

    if (detalhes.erros.quantidade > 0) {
      const arquivoDeErros = Buffer.from(detalhes.erros.logs).toString(
        "base64"
      );
      const anexos = [
        {
          filename: `logs-de-erro-raps-${format(new Date(), "dd-MM-yyy")}.txt`,
          fileBuffer: arquivoDeErros,
        },
      ];

      return await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
    }

    return await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de serviços exportados:", error);
    throw new Error("Erro ao enviar e-mail de serviços exportados:");
  }
};

const importarComissõesDetalhes = async ({ usuario, detalhes }) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
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
    <p>Linhas lidas: ${detalhes?.linhasEncontradas}</p>
    <p>Linhas com erro: ${detalhes?.linhasLidasComErro}</p>
    <p>Linhas com sucesso: ${detalhes?.linhasEncontradas - detalhes?.linhasLidasComErro}</p>
    <p>Total de serviços criados: ${detalhes?.linhasEncontradas - detalhes?.linhasLidasComErro}</p>
    <p>Total novos prestadores criados: ${detalhes?.totalDeNovosPrestadores}</p>
    <p>Total de novos tickets criados: ${detalhes?.totalDeNovosTickets}</p>
    <p>Valor total lido: ${detalhes?.valorTotalLido?.toFixed(2)?.replace(".", ",")}</p>`;

    if (process.env.NODE_ENV === "development") {
      // console.log(corpo);
    }

    if (detalhes.erros) {
      const arquivoDeErros = Buffer.from(detalhes.erros).toString("base64");
      const anexos = [{ filename: "log.txt", fileBuffer: arquivoDeErros }];

      return await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
    }

    return await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    // console.error(
    //   "Erro ao enviar e-mail para detalhes de importação de comissões:",
    //   error
    // );
    throw new Error(
      "Erro ao enviar e-mail para detalhes de importação de comissões"
    );
  }
};

const emailErroIntegracaoOmie = async ({ usuario, error }) => {
  try {
    const emailFrom = {
      email: "fabio@oondemand.com.br",
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Erro integração com omie";

    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Ouve um erro na integração com o omie.</p>
    <p>Detalhes do erro: ${error}</p>`;

    await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    // console.error("Erro ao enviar e-mail para erro integração omie:", error);
    throw new Error("Erro ao enviar e-mail para erro integração omie");
  }
};

const emailGeralDeErro = async ({ usuario, documento, tipoDeErro }) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email: usuario.email,
      nome: usuario.nome,
    };

    const assunto = "Erro ao realizar ação!";

    const corpo = `<h1>Olá, ${usuario.nome}!</h1>
    <p>Ouve um erro ao ${tipoDeErro}, segue o log do erro em anexo.</p>`;

    const arquivoDeErro = Buffer.from(documento).toString("base64");
    const anexos = [
      {
        filename: "log.txt",
        fileBuffer: arquivoDeErro,
      },
    ];

    return await enviarEmail(emailFrom, emailTo, assunto, corpo, anexos);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de serviços exportados:", error);
    throw new Error("Erro ao enviar e-mail de serviços exportados:");
  }
};

const emailLinkCadastroUsuarioPrestador = async ({ email, nome, url }) => {
  try {
    const emailFrom = {
      email: process.env.SENDGRID_REMETENTE,
      nome: "OonDemand",
    };

    const emailTo = {
      email,
      nome,
    };

    const assunto = "Acesso Liberado";

    const corpo = `<h1>Olá, ${nome}!</h1>
    <p>Segue o link para acessar o seu app publisher:</p>
    <a href="${url}">Acessar app publisher</a>`;

    return await enviarEmail(emailFrom, emailTo, assunto, corpo);
  } catch (error) {
    // console.error("Erro ao enviar e-mail de serviços exportados:", error);
    throw new Error("Erro ao enviar e-mail de serviços exportados:");
  }
};

module.exports = {
  confirmacaoEmailPrestador,
  emailEsqueciMinhaSenha,
  emailPrestadoresExportados,
  emailServicosExportados,
  emailImportarRpas,
  importarComissõesDetalhes,
  emailErroIntegracaoOmie,
  emailGeralDeErro,
  emailLinkCadastroUsuarioPrestador,
};
