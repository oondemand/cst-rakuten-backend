# Documento de Arquitetura e Segurança do Projeto CST-Rakuten

## 1. Introdução

Este documento detalha a arquitetura e as práticas de segurança implementadas no projeto **CST-Rakuten**, desenvolvido utilizando tecnologias modernas como Node.js, Express e MongoDB. O objetivo é fornecer uma visão abrangente dos componentes do sistema, seu funcionamento e as medidas adotadas para garantir a integridade, confidencialidade e disponibilidade das informações.

## 2. Visão Geral do Sistema

O **CST-Rakuten** é uma aplicação backend que gerencia processos relacionados a prestadores de serviços, tickets, serviços, integrações com a API da Omie, além de funcionalidades de autenticação e autorização de usuários. A aplicação segue uma arquitetura RESTful, permitindo comunicação eficiente com clientes front-end e serviços externos.

## 3. Componentes Arquiteturais

### 3.1. Servidor Express

O servidor principal é configurado nos arquivos `app.js` e `server.js`. Utilizando o framework **Express**, o servidor gerencia rotas, middlewares e a configuração geral da aplicação. O Express facilita a modularização das rotas e a implementação de middlewares globais para segurança e logging.

### 3.2. Banco de Dados MongoDB

A aplicação utiliza **MongoDB** como banco de dados NoSQL, acessado através do ORM **Mongoose**. A configuração da conexão está localizada em `src/config/db.js`, onde são definidas as variáveis de ambiente para uma conexão segura com o banco de dados.

### 3.3. Modelos de Dados (Mongoose Schemas)

Os modelos de dados estão localizados em `src/models/` e definem a estrutura das coleções do MongoDB, incluindo:

- **Usuario**
- **Prestador**
- **Ticket**
- **Servico**
- **Arquivo**
- **Log**
- **Etapa**
- **BaseOmie**

Cada modelo contém validações e relações entre si para garantir a consistência e integridade dos dados.

### 3.4. Controladores

Localizados em `src/controllers/`, os controladores gerenciam a lógica de negócio para cada rota. Eles interagem com os modelos para realizar operações CRUD, processar dados de integrações externas e gerenciar o fluxo de trabalho dos tickets e serviços.

### 3.5. Roteadores

Os roteadores em `src/routers/` definem os endpoints da API e associam cada rota ao respectivo controlador. Exemplos incluem:

- `authRouter`
- `ticketRouter`
- `usuarioRouter`
- `prestadorRouter`
- `servicoRouter`
- `etapaRouter`
- `logRouter`
- `baseOmieRouter`

Essa organização permite uma estrutura clara e modular das rotas da aplicação.

### 3.6. Serviços Externos (Omie API)

A aplicação integra-se com a **API da Omie** através dos serviços localizados em `src/services/omie/`, como:

- `clienteService.js`
- `contaPagarService.js`
- `anexosService.js`

Esses serviços gerenciam a comunicação com a Omie para operações de clientes e contas a pagar, incluindo tratamento de erros e tentativas de reconexão para garantir resiliência na comunicação.

### 3.7. Middlewares

#### 3.7.1. authMiddleware

Localizado em `src/middlewares/authMiddleware.js`, este middleware verifica a validade do token JWT em cada requisição protegida, garantindo que apenas usuários autenticados possam acessar determinadas rotas.

#### 3.7.2. rastreabilidadeMiddleware

Localizado em `src/middlewares/rastreabilidadeMiddleware.js`, este middleware registra logs detalhados das requisições e respostas, armazenando informações como usuário, endpoint, método HTTP, IP e dados de requisição e resposta.

### 3.8. Utilitários

Localizados em `src/utils/`, os utilitários incluem funcionalidades para:

- Manipulação de datas (`dateUtils.js`)
- Formatação de dados (`formatters.js`)
- Manipulação de arquivos (`fileHandler.js`)
- Envio de emails (`emailUtils.js`)
- Interações com APIs externas (`brasilApi.js`)

## 4. Fluxo de Dados

O fluxo de dados no sistema inicia-se com a requisição de um cliente para um endpoint específico. O roteador correspondente direciona a requisição ao controlador apropriado, que processa a lógica de negócio, interage com os modelos para acessar ou modificar dados no banco de dados, e retorna uma resposta ao cliente. Durante esse processo, middlewares globais e específicos garantem a segurança e rastreabilidade das operações.

### Exemplo de Fluxo:

1. **Cliente faz uma requisição** para criar um novo ticket.
2. **Roteador (`ticketRouter`)** direciona a requisição para o **Controlador (`ticketController`)**.
3. **Controlador** valida os dados e interage com o **Modelo (`Ticket`)** para salvar as informações no MongoDB.
4. **Middlewares** autenticam o usuário e registram logs da operação.
5. **Resposta** é enviada de volta ao cliente confirmando a criação do ticket.

## 5. Medidas de Segurança

A segurança é uma preocupação central no desenvolvimento do CST-Rakuten. As principais medidas implementadas incluem:

### 5.1. Autenticação e Autorização

- **JWT (JSON Web Tokens)**: Utilizado para autenticação, os tokens JWT são gerados no login e verificados em cada requisição protegida através do `authMiddleware`. Isso assegura que apenas usuários autenticados tenham acesso a recursos sensíveis.

- **Hashing de Senhas**: As senhas dos usuários são armazenadas de forma segura utilizando **bcrypt** para hashing, prevenindo o vazamento de senhas em caso de brechas de segurança.

### 5.2. Proteção de Dados

- **Helmet**: Implementado via middleware global em `app.js`, o Helmet adiciona cabeçalhos HTTP para proteger a aplicação contra ataques bem conhecidos, como XSS, clickjacking e injeção de conteúdo.

- **CORS (Cross-Origin Resource Sharing)**: Configurado para permitir apenas origens confiáveis, prevenindo requisições maliciosas de domínios não autorizados.

### 5.3. Validação de Entrada

- **Mongoose Schemas**: As validações nos modelos garantem que apenas dados com formatos e restrições esperadas sejam armazenados no banco de dados, prevenindo injeções de dados e inconsistências.

### 5.4. Limitação de Tamanho de Upload

- **Multer**: Configurado com limites de tamanho de arquivo para prevenir ataques de negação de serviço (DoS) por upload de arquivos muito grandes. Por exemplo, a rota `importar-comissoes` limita o tamanho dos arquivos para 10MB.

### 5.5. Logging e Monitoramento

- **Winston Logger**: Utilizado para registrar logs de erro e informações em arquivos específicos (`logs/error.log` e `logs/info.log`), facilitando o monitoramento e a identificação de problemas.

- **Rastreabilidade Middleware**: Armazena logs detalhados de cada requisição e resposta, permitindo auditorias e análises detalhadas de atividades no sistema.

### 5.6. Gestão de Erros

- **Middleware de Erro**: Implementado em `app.js`, captura e trata erros globais, retornando respostas apropriadas e evitando vazamento de informações sensíveis.

- **Retries e Handling de Erros em Serviços Externos**: Serviços que interagem com APIs externas implementam tentativas de reconexão e tratamento de erros para garantir resiliência na comunicação.

### 5.7. Segurança de API

- **Proteção contra Ataques de Força Bruta**: Implementação de limites de tentativas de login e outras medidas para prevenir ataques de força bruta.

- **Sanitização de Entrada**: Embora não explicitamente mencionado no código fornecido, é recomendável implementar sanitização de entrada para prevenir injeções de código e outros ataques.

## 6. Tecnologias Utilizadas

- **Node.js**: Ambiente de execução para JavaScript no servidor.
- **Express**: Framework web para Node.js.
- **MongoDB**: Banco de dados NoSQL.
- **Mongoose**: ORM para MongoDB.
- **JWT**: Autenticação e autorização.
- **bcrypt**: Hashing de senhas.
- **SendGrid**: Serviço de envio de emails.
- **Multer**: Manipulação de uploads de arquivos.
- **Helmet**: Segurança de cabeçalhos HTTP.
- **Winston**: Logging.
- **axios**: Cliente HTTP para integrações externas.
- **date-fns**: Manipulação de datas.
- **dotenv**: Gerenciamento de variáveis de ambiente.
- **crypto**: Criptografia e geração de hashes.

## 7. Conclusão

O projeto **CST-Rakuten** foi desenvolvido com uma arquitetura modular e segura, adotando boas práticas de desenvolvimento para garantir escalabilidade, manutenção e proteção dos dados. As integrações com serviços externos e as medidas de segurança implementadas asseguram que a aplicação possa operar de forma eficiente e confiável, atendendo às necessidades dos usuários e mantendo a integridade das informações.

---

Este documento serve como uma referência para desenvolvedores, auditores e partes interessadas que desejam compreender a estrutura e as medidas de segurança implementadas no projeto CST-Rakuten.