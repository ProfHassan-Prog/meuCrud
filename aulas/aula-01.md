# Aula 1 — Ambiente, Projeto e Primeiro Servidor Express

## O que vamos construir

Ao longo dessas aulas, vamos construir do zero um sistema CRUD completo.
CRUD é a sigla em inglês para as quatro operações fundamentais de qualquer sistema que lida com dados:

| Letra | Operação | O que faz | Exemplo |
|-------|----------|-----------|---------|
| C | Create (Criar) | Insere um novo registro | Cadastrar um usuário |
| R | Read (Ler) | Busca e exibe registros | Listar todos os usuários |
| U | Update (Atualizar) | Modifica um registro existente | Editar o nome de um usuário |
| D | Delete (Excluir) | Remove um registro | Deletar um produto |

O sistema que vamos construir terá:

- Um **painel administrativo** onde é possível ver, pesquisar, editar e excluir usuários e produtos
- Um **formulário de cadastro** de usuários
- Um **formulário de cadastro** de produtos
- Uma **página de login** com validação

---

## As tecnologias

Antes de escrever qualquer código, entenda o papel de cada tecnologia:

### Node.js
Node.js é um ambiente de execução de JavaScript fora do navegador. Normalmente, JavaScript só roda dentro do browser (Chrome, Firefox, etc.). O Node.js permite rodar JavaScript no servidor — ou seja, no seu computador — para receber requisições, processar dados e responder ao usuário.

### npm (Node Package Manager)
npm é o gerenciador de pacotes do Node.js. Um pacote é um conjunto de código pronto que outra pessoa escreveu e disponibilizou para uso. Em vez de escrever tudo do zero, usamos pacotes. O npm permite instalar, atualizar e gerenciar esses pacotes.

### Express
Express é um pacote (framework) para Node.js que facilita a criação de servidores web. Sem o Express, criar rotas e responder requisições HTTP exigiria muito código manual. Com o Express, o trabalho fica mais simples e organizado.

### MySQL
MySQL é um sistema de banco de dados relacional. Os dados (usuários, produtos) precisam ser salvos em algum lugar persistente — se salvarmos apenas em variáveis JavaScript, os dados somem quando o servidor reinicia. O MySQL armazena os dados em tabelas, como planilhas, que persistem em disco.

### mysql2
mysql2 é o pacote npm que permite ao Node.js se comunicar com o MySQL. Sem ele, o JavaScript não sabe como "falar" com o banco de dados.

### MVC (Model — View — Controller)
MVC é um padrão de organização de código que divide a aplicação em três camadas com responsabilidades separadas:

```
Model      → Responsável pelos dados (SQL, banco de dados)
View       → Responsável pela interface (HTML, CSS)
Controller → Responsável pela lógica (recebe a requisição, chama o model, envia a resposta)
```

O fluxo sempre segue esta ordem:

```
Usuário → View (HTML) → Controller → Model → Banco de dados
                                          ↓
Usuário ← View (HTML) ← Controller ←────┘
```

---

## Passo 1 — Instalando o ambiente

### Node.js

1. Acesse [https://nodejs.org](https://nodejs.org)
2. Baixe a versão **LTS** (Long Term Support — versão estável recomendada)
3. Execute o instalador e siga as instruções
4. Após a instalação, abra o terminal e verifique:

```bash
node -v
```

Deve retornar algo como `v20.11.0`. Isso confirma que o Node.js foi instalado.

```bash
npm -v
```

Deve retornar algo como `10.2.4`. O npm é instalado automaticamente junto com o Node.js.

### MySQL

1. Acesse o site oficial do MySQL e baixe o **MySQL Community Server** e o **MySQL Workbench**
2. Durante a instalação, defina uma senha para o usuário `root` — anote essa senha, pois será usada para conectar ao banco
3. Após instalar, abra o **MySQL Workbench** para confirmar que está funcionando

---

## Passo 2 — Criando o projeto

Abra o terminal na pasta onde deseja criar o projeto e execute:

```bash
mkdir meuCRUD
cd meuCRUD
```

- `mkdir meuCRUD` — cria uma pasta chamada `meuCRUD`
- `cd meuCRUD` — entra dentro dessa pasta

Agora inicie o projeto Node.js com:

```bash
npm init
```

O npm vai fazer uma série de perguntas. Pressione Enter para aceitar os valores padrão em cada uma:

```
package name: (meuCRUD)        → nome do projeto (Enter)
version: (1.0.0)               → versão (Enter)
description:                   → descrição opcional (Enter)
entry point: (index.js)        → arquivo principal (Enter — mantenha index.js)
test command:                  → (Enter)
git repository:                → (Enter)
keywords:                      → (Enter)
author:                        → seu nome ou (Enter)
license: (ISC)                 → (Enter)
```

Ao final, o npm pergunta `Is this OK? (yes)` — pressione Enter para confirmar.

---

## Passo 3 — Entendendo o package.json

Após o `npm init`, um arquivo chamado `package.json` foi criado na pasta do projeto. Abra-o:

```json
{
  "name": "meuCRUD",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}
```

Entendendo cada campo:

| Campo | O que significa |
|-------|-----------------|
| `"name"` | Nome do projeto |
| `"version"` | Versão atual do projeto |
| `"main"` | Arquivo de entrada — o Node.js começa lendo este arquivo |
| `"scripts"` | Atalhos de comandos que você pode executar com `npm run` |
| `"author"` | Nome do autor |
| `"license"` | Tipo de licença do código |

O `package.json` é o documento de identidade do projeto. Qualquer pessoa que clonar o repositório saberá quais dependências instalar olhando para ele.

---

## Passo 4 — Instalando as dependências

Execute no terminal:

```bash
npm install express mysql2
```

O que acontece ao rodar esse comando:

1. O npm acessa a internet e baixa os pacotes `express` e `mysql2`
2. Cria uma pasta chamada `node_modules` dentro do projeto
3. Coloca todos os arquivos baixados dentro de `node_modules`
4. Atualiza o `package.json` automaticamente, adicionando:

```json
"dependencies": {
  "express": "^5.2.1",
  "mysql2": "^3.22.5"
}
```

A seção `"dependencies"` registra quais pacotes o projeto precisa para funcionar. Isso é importante porque a pasta `node_modules` não deve ser enviada ao GitHub (ela pode ter centenas de megabytes). Qualquer pessoa que baixar o projeto pode recriar a `node_modules` rodando `npm install`.

### O arquivo package-lock.json

Junto com `node_modules`, o npm também cria um `package-lock.json`. Esse arquivo registra a versão exata de cada pacote instalado, garantindo que todos que usarem o projeto tenham exatamente as mesmas versões.

---

## Passo 5 — Criando a estrutura de pastas MVC

Crie as seguintes pastas dentro de `meuCRUD`:

```
meuCRUD/
├── config/
├── models/
├── controllers/
├── routes/
└── public/
    ├── css/
    ├── js/
    └── imagens/
```

Você pode criar as pastas pelo terminal:

```bash
mkdir config models controllers routes public public/css public/js public/imagens
```

Ou criá-las manualmente pelo explorador de arquivos.

**Por que essa estrutura?**

| Pasta | Responsabilidade |
|-------|------------------|
| `config/` | Configurações do projeto (conexão com banco de dados) |
| `models/` | Funções que acessam o banco de dados (SQL) |
| `controllers/` | Lógica da aplicação (processa a requisição, chama o model, envia a resposta) |
| `routes/` | Define quais URLs existem e qual controller cada uma chama |
| `public/` | Arquivos enviados diretamente ao navegador (HTML, CSS, imagens, JS do cliente) |

---

## Passo 6 — Criando o arquivo index.js

Crie o arquivo `index.js` na raiz do projeto (não dentro de nenhuma pasta).
Este é o coração do servidor — é o primeiro arquivo que o Node.js lê quando o servidor inicia.

```js
const express = require('express')
const path = require('path')

const app = express()
const port = 8000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

Agora vamos analisar **cada linha** em detalhes.

---

### Linha 1 — Importando o Express

```js
const express = require('express')
```

**`require()`** é a função do Node.js usada para importar módulos (pacotes ou outros arquivos).

- Ela recebe **um argumento**: o nome do pacote ou o caminho do arquivo a importar
- Ela **retorna** o conteúdo do módulo — no caso do Express, retorna uma função

**`'express'`** é o nome do pacote que instalamos. O Node.js procura esse nome dentro de `node_modules`.

**`const express`** armazena o que `require` retornou. A partir daqui, `express` é uma função que usaremos para criar o servidor.

---

### Linha 2 — Importando o Path

```js
const path = require('path')
```

**`path`** é um módulo nativo do Node.js — ele já vem instalado, não precisa de `npm install`.

Ele serve para trabalhar com caminhos de arquivos e pastas de forma compatível com qualquer sistema operacional (Windows usa `\`, Linux e Mac usam `/`). O módulo `path` resolve essas diferenças automaticamente.

---

### Linha 4 — Criando a aplicação Express

```js
const app = express()
```

Aqui chamamos a função `express()` sem argumentos.

- Ela **retorna** um objeto que representa a aplicação web
- Esse objeto contém todos os métodos que usaremos: `app.use()`, `app.get()`, `app.post()`, `app.listen()`, etc.
- Por convenção, armazenamos esse objeto na variável `app`

---

### Linha 5 — Definindo a porta

```js
const port = 8000
```

A porta é um número que identifica qual "canal" o servidor vai usar para receber conexões.

- O número `8000` é uma convenção para servidores de desenvolvimento
- A porta `80` é usada por servidores em produção (HTTP)
- A porta `443` é usada para HTTPS
- Qualquer número entre `1024` e `65535` pode ser usado no desenvolvimento

Quando você acessa `http://localhost:8000`, o browser está se conectando ao seu próprio computador (`localhost`) na porta `8000`.

---

### Linha 7 — Middleware para formulários HTML

```js
app.use(express.urlencoded({ extended: true }))
```

**O que é middleware?**
Middleware é uma função que fica no meio do caminho entre a requisição chegar e a resposta ser enviada. Toda vez que uma requisição chega ao servidor, ela passa pelos middlewares antes de chegar à rota.

**`app.use()`** registra um middleware. Ele recebe como argumento a função de middleware a ser usada.

**`express.urlencoded()`** é um middleware embutido no Express. Ele lê o corpo de requisições enviadas por formulários HTML (o formato é chamado de `application/x-www-form-urlencoded`) e transforma os dados em um objeto JavaScript acessível por `req.body`.

Exemplo: quando um formulário HTML envia `nome=João&email=joao@email.com`, esse middleware transforma isso em:
```js
req.body = {
    nome: 'João',
    email: 'joao@email.com'
}
```

**`{ extended: true }`** é o objeto de configuração do middleware. O argumento `extended: true` permite que os dados enviados no formulário sejam objetos e arrays complexos, além de strings simples. Para a maioria dos projetos, `true` é a opção correta.

---

### Linha 8 — Middleware para JSON

```js
app.use(express.json())
```

**`express.json()`** é outro middleware embutido. Ele lê o corpo de requisições enviadas no formato JSON e também transforma em `req.body`.

O formato JSON é usado quando o frontend envia dados via `fetch()` ou `XMLHttpRequest` com `Content-Type: application/json`. Neste projeto ainda não usamos isso, mas é boa prática registrar o middleware desde o início.

---

### Linha 9 — Servindo arquivos estáticos

```js
app.use(express.static(path.join(__dirname, 'public')))
```

**`express.static()`** é um middleware que serve arquivos diretamente ao navegador, sem passar por nenhum controller.

Tudo que estiver na pasta `public/` ficará acessível diretamente pela URL:
- `public/css/style.css` → acessível em `http://localhost:8000/css/style.css`
- `public/imagens/foto.jpg` → acessível em `http://localhost:8000/imagens/foto.jpg`

**`path.join()`** monta um caminho de pasta de forma segura. Ela recebe múltiplos argumentos (partes do caminho) e os une com o separador correto do sistema operacional.

**`__dirname`** é uma variável especial do Node.js que contém o caminho absoluto da pasta onde o arquivo atual está. Se o seu projeto está em `C:\Projetos\meuCRUD\index.js`, então `__dirname` vale `C:\Projetos\meuCRUD`.

Portanto, `path.join(__dirname, 'public')` resulta em `C:\Projetos\meuCRUD\public` — o caminho completo da pasta de arquivos estáticos.

---

### Linhas 11 a 13 — Criando a primeira rota

```js
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
```

**`app.get()`** define uma rota que responde a requisições do tipo **GET**.

O método GET é o tipo de requisição que o browser faz quando você digita uma URL e pressiona Enter. É o método de "buscar" algo.

**`app.get()`** recebe dois argumentos:

1. **`'/'`** — a URL que essa rota responde. A barra `/` representa a raiz do site, ou seja, `http://localhost:8000/`

2. **`(req, res) => { ... }`** — uma função chamada de **callback de rota** ou **handler**. Essa função é executada toda vez que alguém acessa a URL definida. Ela recebe dois parâmetros:
   - **`req`** (abreviação de *request* — requisição): objeto com todas as informações que o cliente enviou (URL, dados do formulário, cabeçalhos, etc.)
   - **`res`** (abreviação de *response* — resposta): objeto com métodos para enviar a resposta de volta ao cliente

**`res.sendFile()`** envia um arquivo como resposta. Ela recebe como argumento o caminho completo do arquivo a enviar.

`path.join(__dirname, 'public', 'index.html')` resulta em `C:\Projetos\meuCRUD\public\index.html`.

**Resumo do fluxo desta rota:**
```
Browser acessa http://localhost:8000/
        ↓
Express identifica que é GET /
        ↓
Executa o callback (req, res) => { ... }
        ↓
res.sendFile() lê o arquivo index.html do disco
        ↓
Envia o conteúdo do arquivo como resposta
        ↓
Browser recebe o HTML e exibe a página
```

---

### Linhas 15 a 17 — Iniciando o servidor

```js
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

**`app.listen()`** inicia o servidor e faz ele começar a "escutar" conexões na porta especificada. Sem essa linha, o servidor nunca ligaria.

**`app.listen()`** recebe dois argumentos:

1. **`port`** — o número da porta onde o servidor vai escutar (`8000`)

2. **`() => { ... }`** — um callback executado **uma única vez**, quando o servidor termina de iniciar com sucesso. É usado para confirmar no terminal que tudo está funcionando.

**`` `Servidor rodando em http://localhost:${port}` ``** é uma template string do JavaScript. As crases (`` ` ``) permitem interpolar variáveis dentro de strings usando `${}`. O resultado é a string `"Servidor rodando em http://localhost:8000"`.

**`console.log()`** exibe uma mensagem no terminal.

---

## Passo 7 — Criando a primeira página HTML

Crie o arquivo `public/index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeuCRUD</title>
</head>
<body>
    <h1>Servidor funcionando!</h1>
    <p>Bem-vindo ao MeuCRUD.</p>
</body>
</html>
```

Este arquivo será servido pelo Express quando alguém acessar `http://localhost:8000/`.

---

## Passo 8 — Rodando o servidor

No terminal, dentro da pasta `meuCRUD`, execute:

```bash
node index.js
```

**`node`** é o comando para executar um arquivo JavaScript com o Node.js.
**`index.js`** é o arquivo que queremos executar.

Se tudo estiver correto, o terminal deve exibir:

```
Servidor rodando em http://localhost:8000
```

Agora abra o navegador e acesse `http://localhost:8000`. Você deve ver a página com "Servidor funcionando!".

Para **parar o servidor**, pressione `Ctrl + C` no terminal.

---

## Visualizando o fluxo completo

Veja o que acontece desde o momento em que você digita a URL até a página aparecer no browser:

```
1. Você digita http://localhost:8000 no navegador

2. O browser envia uma requisição GET para a porta 8000 do seu computador

3. O Node.js (com Express) está escutando na porta 8000 e recebe a requisição

4. O Express verifica qual rota corresponde a GET /
   → Encontra: app.get('/', ...)

5. O Express executa o callback da rota
   → res.sendFile(...public/index.html...)

6. O Express lê o arquivo index.html do disco

7. O Express envia o conteúdo do arquivo como resposta HTTP

8. O browser recebe o HTML e renderiza a página na tela
```

---

## Revisão — o que cada parte faz

| Código | Função |
|--------|--------|
| `require('express')` | Importa o framework Express |
| `require('path')` | Importa o módulo de caminhos do Node.js |
| `express()` | Cria a instância da aplicação |
| `app.use(middleware)` | Registra um middleware global |
| `express.urlencoded()` | Lê dados de formulários HTML |
| `express.json()` | Lê dados no formato JSON |
| `express.static(pasta)` | Serve arquivos da pasta diretamente |
| `app.get(url, callback)` | Define uma rota para requisições GET |
| `req` | Objeto com os dados da requisição |
| `res` | Objeto com os métodos de resposta |
| `res.sendFile(caminho)` | Envia um arquivo como resposta |
| `app.listen(porta, callback)` | Inicia o servidor na porta especificada |
| `__dirname` | Caminho absoluto da pasta do arquivo atual |
| `path.join(...)` | Une partes de um caminho de forma segura |

---

---

## Recapitulação

### O que aprendemos

- O que é CRUD e por que é o padrão fundamental de qualquer sistema de dados
- O papel de cada tecnologia: Node.js, npm, Express, MySQL
- Como o padrão MVC organiza o código em responsabilidades separadas
- Como iniciar um projeto Node.js do zero com `npm init`
- O que é `package.json` e para que serve cada campo
- Como instalar dependências com `npm install`
- O que é `node_modules` e por que não deve ir ao GitHub
- Como criar um servidor Express completo e o que cada linha faz
- O que são middleware, rotas, `req` e `res`
- O fluxo completo de uma requisição: do browser até o servidor e de volta

### O que fizemos no projeto

Ao final desta aula, o projeto tem a seguinte estrutura:

```
meuCRUD/
├── package.json          ← criado pelo npm init
├── package-lock.json     ← criado pelo npm install
├── index.js              ← servidor Express criado nesta aula
├── node_modules/         ← criado pelo npm install (não enviar ao GitHub)
├── config/               ← pasta criada (vazia por enquanto)
├── models/               ← pasta criada (vazia por enquanto)
├── controllers/          ← pasta criada (vazia por enquanto)
├── routes/               ← pasta criada (vazia por enquanto)
└── public/
    ├── index.html        ← página de teste criada nesta aula
    ├── css/              ← pasta criada (vazia por enquanto)
    ├── js/               ← pasta criada (vazia por enquanto)
    └── imagens/          ← pasta criada (vazia por enquanto)
```

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `package.json` | Identidade do projeto e lista de dependências |
| `index.js` | Servidor Express com middlewares configurados e uma rota GET `/` |
| `public/index.html` | Página HTML de teste exibida em `http://localhost:8000` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ GET / responde com public/index.html ✓
```

---

## Na próxima aula

Na **Aula 2** vamos aprofundar o sistema de rotas do Express:
- Criar rotas com diferentes métodos HTTP (GET e POST)
- Entender como `req.params` e `req.query` funcionam
- Criar múltiplas páginas HTML e navegar entre elas
- Entender como o Express decide qual rota executar
