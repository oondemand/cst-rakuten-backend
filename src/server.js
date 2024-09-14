// backend/server.js

const app = require('./app');
require('dotenv').config();
const connectDB = require("./config/db");

const PORT = process.env.PORT;
const SERVICE_NAME = process.env.SERVICE_NAME;

app.listen(PORT, async () => {
    console.log(`Iniciando serviço ${SERVICE_NAME}...`);
    
    await connectDB();

    console.log(`${SERVICE_NAME} rodando na porta ${PORT} e conectado ao MongoDB`);
});
