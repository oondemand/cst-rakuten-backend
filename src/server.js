// backend/server.js

const app = require('./app');
require('dotenv').config();

const PORT = process.env.PORT;
const SERVICE_NAME = process.env.SERVICE_NAME;

app.listen(PORT, () => {
    console.log(`${SERVICE_NAME} rodando na porta ${PORT}`);
});
