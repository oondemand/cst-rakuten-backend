exports.conviteTemplate = async ({ url }) => {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-mail</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f9f9f9;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background: #fff;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .header-container {
            width: 100%;
            height: auto;
            background: none;
            margin: 0;
            padding: 0;
        }
        .header-image {
            width: 100%;
            /* Faz a imagem ocupar 100% da largura do container */
            height: auto;
            /* Mantém a proporção da imagem */
            display: block;
            /* Remove espaços extras ao redor da imagem */
        }
        .content {
            padding: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <header class="header-container">
            <img class="header-image" src="https://homolog.api.rakuten.oondemand.com.br/image/convite-banner.png" alt="Header Image" >
        </header>
        <h1>Nova plataforma de pagamentos no ar!</h1>
        <div class="content">
            <a href="${url}">Clique aqui para se cadastrar na nova Plataforma de Pagamento de Publishers Rakuten Advertising!</a>
            <p>Atenciosamente,<br>Sua equipe</p>
        </div>
        <div class="footer">
            <p>Caso tenha alguma dúvida ou dificuldade, entre em contato com nosso time pelo email
                brpubsupport@rakuten.com</p>
        </div>
    </div>
</body>
</html>`;
};
