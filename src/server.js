const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME;

const startServer = async () => {
  try {
    console.log("Testando conexão com o Banco de Dados...");
    await connectDB();

    app.listen(PORT, () => {
      console.log(
        "****************************************************************",
      );
      console.log(
        `${SERVICE_NAME} rodando na porta ${PORT} e conectado ao MongoDB`,
      );
      console.log(
        "****************************************************************",
      );
      console.log("");
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
