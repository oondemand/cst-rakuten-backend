const app = require('./app');
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;
const SERVICE_NAME = process.env.SERVICE_NAME || "CST Rakuten";

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log("****************************************************************");
      console.log(`${SERVICE_NAME} rodando na porta ${PORT} e conectado ao MongoDB`);
      console.log("****************************************************************");
      console.log("");
    });
  } catch (error) {
    console.error("Falha ao iniciar o servidor:", error);
    process.exit(1);
  }
};

startServer();
