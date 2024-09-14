# Etapa 1: Utilizar a imagem oficial do Node.js (alpine para ser mais leve)
FROM node:18-alpine

# Etapa 2: Definir o diretório de trabalho dentro do container
WORKDIR /app

# Etapa 3: Copiar os arquivos de dependências (package.json e package-lock.json)
COPY package*.json ./

# Etapa 4: Instalar as dependências de produção
RUN npm install --production

# Etapa 5: Copiar todo o código da aplicação para o diretório de trabalho
COPY . .

# Etapa 6: Expõe a porta que o aplicativo usa (porta 4000)
EXPOSE 4000

# Etapa 7: Definir a variável de ambiente para produção
ENV NODE_ENV=production

# Etapa 8: Comando para rodar a aplicação no ambiente de produção
CMD ["node", "src/server.js"]