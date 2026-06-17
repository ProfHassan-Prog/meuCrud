# Aula 2 — Rotas, Requisições e Respostas

## Revisão da Aula 1

Na aula anterior:
- Instalamos Node.js e criamos o projeto com `npm init`
- Entendemos o `package.json` e instalamos o Express com `npm install`
- Criamos o `index.js` com um servidor Express básico
- Aprendemos o que são middlewares, rotas e os objetos `req` e `res`
- O servidor responde com um HTML quando alguém acessa `http://localhost:8000/`

Nesta aula vamos aprofundar o sistema de rotas — o mecanismo central do Express.

---

## O protocolo HTTP

Toda comunicação entre o browser e o servidor acontece através do protocolo **HTTP** (HyperText Transfer Protocol). Entender o HTTP é fundamental para construir qualquer aplicação web.

### O que é uma requisição HTTP

Quando você digita uma URL no browser e pressiona Enter, o browser envia uma **requisição HTTP** ao servidor. Uma requisição é uma mensagem que contém:

- **Método** — o tipo de operação que está sendo feita (GET, POST, etc.)
- **URL** — o endereço que está sendo acessado (`/usuarios`, `/adm`, etc.)
- **Cabeçalhos** (headers) — informações extras como o tipo de browser, idioma, tipo de conteúdo enviado
- **Corpo** (body) — os dados enviados junto com a requisição (presente apenas em POST, PUT, PATCH)

O servidor recebe a requisição, processa e envia uma **resposta HTTP**, que contém:

- **Código de status** — um número que indica o resultado (200, 404, 302, etc.)
- **Cabeçalhos** — informações sobre a resposta (tipo de conteúdo, tamanho, etc.)
- **Corpo** — o conteúdo da resposta (HTML, JSON, imagem, etc.)

### Métodos HTTP

O método HTTP indica **o que o cliente quer fazer**. Os mais usados são:

| Método | Intenção | Exemplo de uso |
|--------|----------|----------------|
| GET | Buscar/visualizar algo | Acessar uma página, listar usuários |
| POST | Enviar dados para criar algo | Submeter um formulário, cadastrar usuário |
| PUT | Substituir um recurso completamente | Atualizar todos os dados de um usuário |
| PATCH | Atualizar parte de um recurso | Atualizar só o email de um usuário |
| DELETE | Remover um recurso | Excluir um produto |

**Importante:** formulários HTML (`<form>`) suportam apenas `GET` e `POST`. Os métodos `PUT`, `PATCH` e `DELETE` só podem ser usados via JavaScript (com `fetch()` ou `XMLHttpRequest`). Como este projeto não usa JavaScript para requisições, usaremos apenas GET e POST.

### Códigos de status HTTP

Toda resposta do servidor vem acompanhada de um código numérico de três dígitos:

| Código | Significado | Quando acontece |
|--------|-------------|-----------------|
| 200 | OK | Requisição bem-sucedida, resposta enviada |
| 201 | Created | Um novo registro foi criado com sucesso |
| 302 | Found (Redirect) | O recurso está em outra URL |
| 404 | Not Found | A URL não existe no servidor |
| 500 | Internal Server Error | Erro no código do servidor |

No Express, o código padrão de uma resposta é `200`. Você pode alterar isso com `res.status()`, como veremos adiante.

### Vendo o HTTP no navegador

Para ver as requisições e respostas HTTP acontecendo em tempo real:

1. Abra o browser e pressione `F12` (ou `Ctrl + Shift + I`)
2. Vá na aba **Network** (Rede)
3. Acesse qualquer página do seu servidor
4. Cada linha na aba Network é uma requisição HTTP

---

## O objeto `res` em profundidade

O objeto `res` (response — resposta) contém os métodos para enviar a resposta ao cliente. Veja os principais:

### res.send()

```js
res.send('Texto qualquer')
res.send('<h1>HTML também funciona</h1>')
```

**O que faz:** envia qualquer conteúdo como resposta — texto, HTML, ou qualquer coisa.

**Argumento:** uma string com o conteúdo a ser enviado.

**Quando usar:** para respostas simples de teste. Em produção, prefira `res.sendFile()` para HTML e `res.json()` para dados.

---

### res.sendFile()

```js
res.sendFile(path.join(__dirname, 'public', 'index.html'))
```

**O que faz:** lê um arquivo do disco e envia seu conteúdo como resposta.

**Argumento:** o caminho **absoluto** do arquivo. Por isso usamos `path.join(__dirname, ...)` — ele garante o caminho absoluto independente do sistema operacional.

**Quando usar:** para servir páginas HTML que não precisam de dados dinâmicos (dados do banco de dados).

---

### res.redirect()

```js
res.redirect('/adm')
res.redirect('/')
res.redirect('/formulario.html')
```

**O que faz:** diz ao browser para fazer uma nova requisição GET para outra URL. O browser recebe o código `302` e imediatamente faz uma nova requisição para a URL indicada.

**Argumento:** a URL de destino do redirecionamento.

**Quando usar:** sempre após processar um POST. Se o usuário cadastrar um usuário e você responder com HTML diretamente, ao pressionar F5 o browser vai repetir o POST e cadastrar o mesmo usuário novamente. Com `res.redirect()`, você envia o browser para outra página com GET, e o F5 apenas recarrega essa nova página sem repetir o cadastro.

Esse padrão se chama **PRG (Post / Redirect / Get)** e é uma boa prática fundamental:

```
1. Usuário submete formulário → POST /usuarios
2. Servidor processa os dados
3. Servidor responde com res.redirect('/adm')   ← 302 Redirect
4. Browser recebe o 302 e faz GET /adm          ← nova requisição
5. Servidor responde com a página do painel     ← 200 OK
```

---

### res.json()

```js
res.json({ nome: 'João', email: 'joao@email.com' })
res.json([1, 2, 3])
res.json({ erro: 'Usuário não encontrado' })
```

**O que faz:** converte um objeto ou array JavaScript para o formato JSON e envia como resposta. Define automaticamente o cabeçalho `Content-Type: application/json`.

**Argumento:** qualquer valor JavaScript — objeto, array, string, número, booleano.

**Quando usar:** em APIs que retornam dados para serem consumidos por JavaScript no frontend ou por outros sistemas.

---

### res.status()

```js
res.status(404).send('Página não encontrada')
res.status(201).json({ mensagem: 'Usuário criado com sucesso' })
```

**O que faz:** define o código de status HTTP da resposta.

**Argumento:** um número inteiro com o código de status desejado.

**Importante:** `res.status()` retorna o próprio `res`, então você deve chamar outro método logo após (como `.send()` ou `.json()`) para realmente enviar a resposta.

---

## O objeto `req` em profundidade

O objeto `req` (request — requisição) contém todas as informações que o cliente enviou ao servidor. Veja as propriedades mais usadas:

### req.method

```js
app.use((req, res, next) => {
    console.log(req.method) // 'GET', 'POST', etc.
    next()
})
```

**O que contém:** uma string com o método HTTP da requisição (`'GET'`, `'POST'`, etc.).

---

### req.url

```js
console.log(req.url) // '/usuarios', '/adm?busca=João', etc.
```

**O que contém:** a URL completa da requisição, incluindo a query string se houver.

---

### req.params

```js
app.get('/usuarios/:id', (req, res) => {
    console.log(req.params)     // { id: '5' }
    console.log(req.params.id)  // '5'
})
```

**O que contém:** um objeto com os parâmetros dinâmicos da URL.

Parâmetros dinâmicos são definidos na rota com dois pontos (`:`) antes do nome. Na URL `/usuarios/5`, o valor `5` será capturado em `req.params.id`.

**Importante:** os valores em `req.params` são sempre **strings**, mesmo que o valor seja um número. Para usar como número, é necessário converter: `Number(req.params.id)` ou `parseInt(req.params.id)`.

---

### req.query

```js
// URL acessada: /adm?busca_usuario=João&pagina=2

app.get('/adm', (req, res) => {
    console.log(req.query)                  // { busca_usuario: 'João', pagina: '2' }
    console.log(req.query.busca_usuario)    // 'João'
    console.log(req.query.pagina)           // '2'
})
```

**O que contém:** um objeto com os parâmetros da **query string** (tudo que vem depois do `?` na URL).

A query string é formada por pares `chave=valor`, separados por `&`. O Express já faz o parsing automaticamente e disponibiliza tudo em `req.query`.

**Quando usar:** para filtros, buscas, paginação — operações de leitura que não alteram dados.

---

### req.body

```js
// Formulário enviou: nome=João&email=joao@email.com

app.post('/usuarios', (req, res) => {
    console.log(req.body)        // { nome: 'João', email: 'joao@email.com' }
    console.log(req.body.nome)   // 'João'
    console.log(req.body.email)  // 'joao@email.com'
})
```

**O que contém:** um objeto com os dados enviados no **corpo da requisição**.

**Requisito:** o middleware `express.urlencoded({ extended: true })` precisa estar registrado (já fizemos isso no `index.js` da Aula 1). Sem ele, `req.body` é `undefined`.

**Quando usar:** em rotas POST para ler os dados enviados pelo formulário HTML.

---

## Rotas no Express

### Como o Express decide qual rota executar

Quando uma requisição chega, o Express percorre as rotas **na ordem em que foram registradas** e executa a **primeira** que combinar com o método e a URL da requisição. As demais rotas são ignoradas.

```js
app.get('/usuarios', (req, res) => {
    res.send('Rota 1 — será executada para GET /usuarios')
})

app.get('/usuarios', (req, res) => {
    res.send('Rota 2 — nunca será executada, a Rota 1 chegou primeiro')
})
```

Isso significa que a **ordem de registro importa muito**. Rotas mais específicas devem vir antes de rotas mais genéricas.

### Rotas com parâmetros dinâmicos

Os dois pontos (`:`) na definição de uma rota criam um parâmetro dinâmico:

```js
// Esta rota responde a qualquer URL no formato /usuarios/QUALQUER_COISA
app.get('/usuarios/:id', (req, res) => {
    const id = req.params.id
    res.send(`Você pediu o usuário de ID: ${id}`)
})
```

Esta rota vai responder a:
- `/usuarios/1` → `id = '1'`
- `/usuarios/42` → `id = '42'`
- `/usuarios/abc` → `id = 'abc'`

**Cuidado com a ordem:** uma rota estática deve vir antes de uma rota com parâmetro, ou a rota com parâmetro vai "engolir" a estática:

```js
// CORRETO — ordem certa
app.get('/usuarios/novo', (req, res) => {   // rota estática primeiro
    res.send('Formulário de novo usuário')
})

app.get('/usuarios/:id', (req, res) => {    // rota dinâmica depois
    res.send(`Usuário ${req.params.id}`)
})

// ERRADO — /usuarios/novo seria capturado por /:id com id = 'novo'
app.get('/usuarios/:id', ...)
app.get('/usuarios/novo', ...)   // nunca chegaria aqui
```

### A diferença entre rotas e arquivos estáticos

Quando uma requisição chega ao Express, ela passa primeiro pelo middleware `express.static()`. Se existir um arquivo na pasta `public/` com aquele nome, o Express o serve diretamente — sem passar por nenhuma rota.

```
Requisição GET /css/style.css
        ↓
express.static() verifica: existe public/css/style.css?
        ↓ SIM
Serve o arquivo direto → as rotas não chegam a ser verificadas

Requisição GET /adm
        ↓
express.static() verifica: existe public/adm?  ou  public/adm.html?
        ↓ NÃO
Express passa para as rotas
        ↓
app.get('/adm', ...) → executa o controller
```

Por isso, nunca deve existir um arquivo estático com o mesmo nome de uma rota importante — o arquivo seria servido e a rota nunca executaria.

---

## Rotas POST

```js
app.post('/usuarios', (req, res) => {
    // lógica aqui
})
```

**`app.post()`** define uma rota que responde exclusivamente a requisições POST.

Ela recebe os mesmos dois argumentos de `app.get()`:
1. A URL da rota (`'/usuarios'`)
2. O callback com `req` e `res`

Uma rota `app.get('/usuarios', ...)` e uma rota `app.post('/usuarios', ...)` podem coexistir com a mesma URL — o Express as diferencia pelo método HTTP.

### Como um formulário HTML envia dados

Quando o usuário clica em `Submit` em um formulário HTML:

1. O browser lê os atributos `action` e `method` do `<form>`
2. Coleta todos os valores dos campos (`<input>`, `<select>`, etc.) usando o atributo `name` de cada campo
3. Envia uma requisição HTTP com o método e URL definidos no form
4. Os dados dos campos vão no **corpo da requisição** (body)

```html
<form action="/usuarios" method="POST">
    <input type="text" name="nome" value="João">
    <input type="email" name="email" value="joao@email.com">
    <button type="submit">Enviar</button>
</form>
```

O que o browser envia para o servidor:

```
POST /usuarios HTTP/1.1
Content-Type: application/x-www-form-urlencoded

nome=Jo%C3%A3o&email=joao%40email.com
```

O middleware `express.urlencoded()` decodifica esse formato e o coloca em `req.body`:

```js
req.body = {
    nome: 'João',
    email: 'joao@email.com'
}
```

O atributo `name` de cada campo HTML se torna a chave no objeto `req.body`.

---

## Tratando rotas não encontradas (404)

Se o usuário acessar uma URL que não existe no servidor, o Express retorna uma página de erro padrão. Para personalizar isso, adicione uma rota ao final do `index.js` (deve ser a última, pois o Express só chegará nela se nenhuma outra rota combinar):

```js
app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})
```

**`app.use()`** sem URL combina com qualquer requisição que chegue até ele.

Por isso essa rota deve ser registrada **depois de todas as outras** — ela é o "pega-tudo" do servidor.

---

## Passo a passo — colocando em prática

Vamos aplicar tudo que aprendemos. Ao final desta seção, teremos:

- Uma `index.html` com link para o formulário
- Uma `formulario.html` com um formulário real
- Uma rota POST que recebe os dados e redireciona

### 1. Atualizando o index.html

Abra `public/index.html` e atualize para ter um link para o formulário:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeuCRUD</title>
</head>
<body>
    <h1>MeuCRUD</h1>
    <p>Sistema de gerenciamento de usuários e produtos.</p>
    <a href="/formulario.html">Cadastrar usuário</a>
</body>
</html>
```

O link `<a href="/formulario.html">` funciona porque o arquivo `formulario.html` está em `public/formulario.html` e o Express o serve automaticamente via `express.static()`. Não precisamos criar uma rota para isso.

### 2. Criando o formulario.html

Crie o arquivo `public/formulario.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastrar Usuário</title>
</head>
<body>

    <h1>Cadastrar Usuário</h1>

    <form action="/usuarios" method="POST">

        <label for="nome">Nome:</label>
        <input type="text" name="nome" id="nome" required>
        <br><br>

        <label for="email">E-mail:</label>
        <input type="email" name="email" id="email" required>
        <br><br>

        <label for="senha">Senha:</label>
        <input type="password" name="senha" id="senha" required>
        <br><br>

        <button type="submit">Cadastrar</button>

    </form>

    <br>
    <a href="/">Voltar</a>

</body>
</html>
```

Pontos importantes deste formulário:

- **`action="/usuarios"`** — define para onde os dados serão enviados. O Express vai procurar uma rota `POST /usuarios`.
- **`method="POST"`** — define que os dados vão no corpo da requisição (body), não na URL.
- **`name="nome"`** — o atributo `name` de cada campo define a chave no objeto `req.body`. Sem o `name`, o campo é ignorado na submissão.
- **`id="nome"`** — usado apenas para associar o `<label>` ao `<input>` (acessibilidade). Não tem relação com o backend.
- **`required`** — validação no browser: impede a submissão se o campo estiver vazio.

### 3. Adicionando a rota POST no index.js

Abra o `index.js` e adicione a rota POST antes da rota 404:

```js
const express = require('express')
const path = require('path')

const app = express()
const port = 8000

// Middlewares
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Rota GET — página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Rota POST — recebe os dados do formulário de usuário
app.post('/usuarios', (req, res) => {
    console.log('Dados recebidos:', req.body)
    res.redirect('/')
})

// Rota 404 — deve ser a última
app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

### 4. Testando

Salve todos os arquivos e reinicie o servidor:

```bash
node index.js
```

**Lembre-se:** sempre que modificar o `index.js` (ou qualquer arquivo `.js` do servidor), é necessário parar o servidor com `Ctrl + C` e iniciá-lo novamente. O Node.js não detecta mudanças automaticamente.

Acesse `http://localhost:8000`, clique no link, preencha o formulário e clique em "Cadastrar". Observe o terminal — você deve ver os dados do formulário exibidos pelo `console.log`:

```
Dados recebidos: { nome: 'João', email: 'joao@email.com', senha: '123456' }
```

Após submeter, o browser é redirecionado para `/` — isso é o `res.redirect('/')` funcionando.

Os dados chegaram ao servidor! Por enquanto apenas imprimimos no terminal, mas nas próximas aulas vamos salvá-los no banco de dados.

---

## Visualizando o fluxo completo

### Fluxo de um GET (acessar uma página)

```
1. Usuário acessa http://localhost:8000/

2. Browser envia:  GET /  HTTP/1.1

3. Express recebe a requisição

4. Middleware express.static():
   verifica se existe public/index.html ou public/  → NÃO (a URL é /)
   passa para o próximo

5. Express verifica as rotas:
   app.get('/') → COMBINA!

6. Executa o callback:
   res.sendFile('.../public/index.html')

7. Express lê o arquivo do disco e envia como resposta

8. Browser recebe o HTML com código 200 e exibe a página
```

### Fluxo de um GET para arquivo estático

```
1. Browser acessa http://localhost:8000/formulario.html

2. Browser envia:  GET /formulario.html  HTTP/1.1

3. Express recebe a requisição

4. Middleware express.static():
   verifica se existe public/formulario.html → SIM!
   serve o arquivo direto, código 200

5. As rotas do app.get() nunca chegam a ser verificadas
```

### Fluxo de um POST (submissão de formulário)

```
1. Usuário preenche o formulário e clica em "Cadastrar"

2. Browser lê: action="/usuarios" method="POST"
   Coleta os campos: nome, email, senha

3. Browser envia:
   POST /usuarios  HTTP/1.1
   Content-Type: application/x-www-form-urlencoded

   nome=João&email=joao@email.com&senha=123456

4. Express recebe a requisição

5. Middleware express.urlencoded():
   decodifica o body
   req.body = { nome: 'João', email: 'joao@email.com', senha: '123456' }

6. Express verifica as rotas:
   app.post('/usuarios') → COMBINA!

7. Executa o callback:
   console.log(req.body) → exibe os dados no terminal
   res.redirect('/') → envia código 302 ao browser

8. Browser recebe o 302 e faz uma nova requisição:
   GET /

9. Express responde com index.html, código 200

10. Browser exibe a página inicial
```

---

## Revisão — o que cada elemento faz

| Elemento | O que é | O que recebe | O que retorna/faz |
|----------|---------|--------------|-------------------|
| `app.get(url, fn)` | Define rota GET | URL + callback | Executa `fn` ao receber GET nessa URL |
| `app.post(url, fn)` | Define rota POST | URL + callback | Executa `fn` ao receber POST nessa URL |
| `app.use(fn)` | Registra middleware global | callback | Executa `fn` em toda requisição |
| `req.params` | Parâmetros de rota | — | Objeto `{ id: '5' }` para `/rota/:id` |
| `req.query` | Parâmetros da URL | — | Objeto `{ busca: 'João' }` para `?busca=João` |
| `req.body` | Corpo da requisição | — | Objeto com os dados do formulário |
| `res.send(texto)` | Envia resposta simples | String | Envia texto/HTML com código 200 |
| `res.sendFile(caminho)` | Envia arquivo | Caminho absoluto | Envia o arquivo com código 200 |
| `res.redirect(url)` | Redireciona | URL | Envia código 302, browser faz nova requisição |
| `res.json(dados)` | Envia JSON | Objeto/array | Envia JSON com código 200 |
| `res.status(codigo)` | Define status | Número | Retorna `res` (encadeia com send/json) |

---

---

## Recapitulação

### O que aprendemos

- O que é HTTP, como funciona e quais são os métodos (GET, POST e os outros)
- O que são códigos de status e o que cada faixa representa
- Como o Express decide qual rota executar (primeira que combinar)
- A diferença entre arquivos estáticos (pasta `public/`) e rotas dinâmicas
- Como usar `req.params` para capturar valores dinâmicos da URL
- Como usar `req.query` para ler parâmetros de busca e filtro
- Como usar `req.body` para ler dados enviados por formulário
- Todos os métodos de resposta do `res`: `send`, `sendFile`, `redirect`, `json`, `status`
- O padrão PRG (Post / Redirect / Get) e por que ele evita duplicação de dados
- Como criar um formulário HTML que envia dados para o servidor
- Como criar uma rota POST que recebe e processa esses dados
- Como adicionar um tratador de 404 ao final das rotas

### O que fizemos no projeto

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `public/index.html` | Adicionado link de navegação para `/formulario.html` |
| `index.js` | Adicionada rota `POST /usuarios` e rota 404 pega-tudo |

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `public/formulario.html` | Formulário HTML com campos `nome`, `email` e `senha`, enviando para `POST /usuarios` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ GET /           responde com public/index.html          ✓
→ GET /formulario.html   servido diretamente (static)     ✓
→ POST /usuarios  recebe req.body e redireciona para /    ✓
→ qualquer outra  responde 404                            ✓
```

**O que ainda não funciona:** os dados chegam ao servidor e aparecem no terminal, mas são perdidos quando o servidor reinicia. Ainda não temos banco de dados.

---

## Na próxima aula

O formulário já envia dados para o servidor, mas esses dados só aparecem no terminal e somem quando o servidor reinicia. Precisamos de um banco de dados para persistir essas informações.

Na **Aula 3** vamos:
- Criar o banco de dados `meuCrud` no MySQL
- Criar as tabelas `usuarios` e `produtos` com todos os campos
- Criar o arquivo `config/database.js` e explicar cada linha
- Conectar o Node.js ao MySQL
- Entender o que é uma query SQL e como o `mysql2` a executa
