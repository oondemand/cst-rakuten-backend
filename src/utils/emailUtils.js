// src/utils/email.js

const enviarEmail = async (email, assunto, corpo) => {
  // Implementação real do envio de e-mail usando um serviço como SendGrid, Mailgun, etc.
  // Por enquanto, está simulando o envio.
  console.log(`Simulação e-mail enviado para ${email} com o assunto: ${assunto}`);
  console.log("Corpo do e-mail:");
  console.log(corpo);
};

const confirmacaoEmailPrestador = async (usuario) => {
  const assunto = "Confirme seu e-mail";

  // Gerar token de confirmação
  const token = usuario.gerarToken();

  // Template do corpo do e-mail com o link de confirmação
  const confirmacaoPrestadorUrl = process.env.CONFIRMACAO_PRESTADOR_URL; // Ex: https://seu-frontend.com/confirmar-email
  const corpo = `<h1>Olá, ${usuario.nome}!</h1>
  <p>Clique no link abaixo para confirmar seu e-mail:</p>
  <a href="${confirmacaoPrestadorUrl}?token=${token}">Confirmar e-mail</a>`;

  await enviarEmail(usuario.email, assunto, corpo);
};

module.exports = { enviarEmail, confirmacaoEmailPrestador };
