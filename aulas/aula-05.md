# Aula 5 — Controller e Rotas: Conectando Tudo e Criando o Primeiro Usuário

## Revisão da Aula 4

Na aula anterior:
- Criamos `models/usuarioModel.js` com as funções `criarUsuario` e `listarUsuarios`
- Aprendemos o padrão de callback propagado: a função do model recebe um callback e o repassa para `conexao.query`
- Entendemos o SQL `INSERT INTO` com `?` e por que ele protege contra SQL Injection
- Entendemos o que o mysql2 entrega no callback após `INSERT` (objeto com `insertId`) e após `SELECT` (array de objetos)
- Criamos uma rota de teste `GET /teste-listar` para visualizar o model funcionando

O formulário ainda não salva dados no banco — ele só faz `console.log` e redireciona. Falta criar as camadas **Controller** e **Rotas**, que são o assunto desta aula.

---

## As três camadas do MVC e onde estamos

Antes de começar, veja onde cada peça se encaixa:

```
[View]          public/formulario.html
                    ↓  POST /usuarios
[Routes]        routes/usuariosRoutes.js       ← criaremos hoje
                    ↓  chama
[Controller]    controllers/usuarioController.js  ← criaremos hoje
                    ↓  chama
[Model]         models/usuarioModel.js         ← criado na Aula 4
                    ↓  executa
[Banco]         MySQL → tabela usuarios
```

- **View** → o HTML que o usuário vê e com o qual interage
- **Routes** → mapeiam URLs para funções do controller
- **Controller** → recebe a requisição do Express, chama o model, envia a resposta
- **Model** → executa o SQL e retorna o resultado
- **Banco** → armazena os dados permanentemente

---

## O que é a camada Controller

O controller é o **coordenador** da requisição. Ele:

1. Recebe os dados da requisição via `req` (vindo do Express)
2. Extrai o que é necessário (`req.body`, `req.params`, etc.)
3. Chama a função correta do model passando esses dados
4. Decide o que fazer com o resultado: redirecionar, enviar HTML, mostrar erro

O controller **não sabe** como os dados são salvos (isso é responsabilidade do model) e **não monta** a página HTML de listagem (isso é responsabilidade do próximo controller, o de ADM). Ele apenas coordena.

### O controller como intermediário

```
Express entrega (req, res) ao controller
        ↓
Controller extrai req.body → passa como objeto simples ao model
        ↓
Model executa SQL → chama callback com (erro, resultado)
        ↓
Controller recebe (erro, resultado) → decide a resposta
        ↓
Controller usa res.redirect() ou res.send() para responder
```

Repare que o **model nunca toca em `req` ou `res`**. Ele nem sabe que o Express existe. Recebe um objeto JavaScript simples e devolve o resultado via callback. Isso é o princípio da responsabilidade única: cada camada faz uma coisa só.

---

## Criando `controllers/usuarioController.js`

Crie o arquivo `controllers/usuarioController.js`:

```js
const usuarioModel = require('../models/usuarioModel')

function criarUsuario(req, res) {
    usuarioModel.criarUsuario(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar usuário.')
        }
        res.redirect('/')
    })
}

module.exports = {
    criarUsuario
}
```

Vamos analisar cada parte.

---

### `require('../models/usuarioModel')`

```js
const usuarioModel = require('../models/usuarioModel')
```

Importa o model de usuários. O `../` sobe da pasta `controllers/` para a raiz do projeto, depois entra em `models/`.

`usuarioModel` será o objeto `{ criarUsuario, listarUsuarios }` exportado pelo model.

---

### A função `criarUsuario(req, res)`

```js
function criarUsuario(req, res) {
    ...
}
```

Esta função tem a **assinatura padrão de um callback de rota do Express**: recebe `req` e `res`.

Ela não é chamada diretamente por nós — o Express a chama automaticamente quando uma requisição chega na rota correspondente. O Express passa `req` e `res` como argumentos.

---

### `usuarioModel.criarUsuario(req.body, callback)`

```js
usuarioModel.criarUsuario(req.body, (erro) => {
    ...
})
```

**`req.body`** — passamos o corpo da requisição diretamente como primeiro argumento.

Na Aula 4, a função do model espera um objeto `usuario` com propriedades como `usuario.nome`, `usuario.email`, etc. Quando o formulário HTML é submetido, `req.body` já tem exatamente esse formato:

```js
req.body = {
    nome: 'João Silva',
    email: 'joao@email.com',
    senha: '123456',
    telefone: '(45) 99999-9999',
    genero: 'masculino',
    data_nascimento: '2000-01-15',
    cidade: 'Medianeira',
    estado: 'PR',
    endereco: 'Rua das Flores, 123'
}
```

As chaves de `req.body` vêm dos atributos `name` dos inputs do formulário. Como os `name` no HTML foram definidos como `nome`, `email`, `senha`, etc. — e o model acessa `usuario.nome`, `usuario.email`, etc. — os nomes coincidem perfeitamente.

**`(erro) => { ... }`** — o callback que será chamado pelo model quando o `INSERT` terminar. Note que aqui usamos apenas `erro` como parâmetro (ignoramos `resultado`), porque após criar um usuário só precisamos saber se deu certo ou não.

---

### Tratamento de erro

```js
if (erro) {
    console.log(erro)
    return res.send('Erro ao cadastrar usuário.')
}
```

**`console.log(erro)`** — exibe o erro completo no terminal do servidor. Isso ajuda no diagnóstico: o terminal mostrará o erro do MySQL (ex: email duplicado, campo obrigatório faltando).

**`return res.send('Erro ao cadastrar usuário.')`** — envia uma mensagem de erro ao usuário e **interrompe a função** com `return`.

Por que o `return` é necessário? Sem ele, após o `res.send()`, o código continuaria e executaria o `res.redirect()` logo abaixo, tentando enviar uma segunda resposta. O Express não permite enviar duas respostas para a mesma requisição — isso causaria um erro no servidor. O `return` garante que a função para aqui.

---

### `res.redirect('/')`

```js
res.redirect('/')
```

Se não houve erro, redireciona o usuário para a página inicial. Isso completa o padrão **PRG (Post / Redirect / Get)** visto na Aula 2: após um POST bem-sucedido, sempre redirecione.

Nas próximas aulas, quando o painel ADM estiver pronto, trocaremos `'/'` por `'/adm'` para ir direto à listagem de usuários após o cadastro.

---

### `module.exports`

```js
module.exports = {
    criarUsuario
}
```

Exporta um objeto com a função `criarUsuario`. Nas aulas seguintes, adicionaremos as outras funções (`listarUsuarios`, `atualizarUsuario`, `deletarUsuario`) aqui dentro.

---

## O que é `express.Router()`

Até agora, definimos rotas diretamente no `index.js` com `app.get()` e `app.post()`. Se colocássemos **todas** as rotas no `index.js`, ele ficaria gigantesco com dezenas de linhas só de rotas.

O `express.Router()` resolve isso: ele cria um **mini-roteador independente** que pode ser definido em um arquivo separado e depois **montado** no `app` com um prefixo de URL.

```js
// SEM Router — tudo em index.js (difícil de manter)
app.post('/usuarios', usuarioController.criarUsuario)
app.get('/usuarios/:id/editar', usuarioController.mostrarFormularioEdicao)
app.post('/usuarios/:id/editar', usuarioController.atualizarUsuario)
app.post('/usuarios/:id/deletar', usuarioController.deletarUsuario)
app.post('/produtos', produtoController.criarProduto)
app.get('/produtos/:id/editar', produtoController.mostrarFormularioEdicao)
// ... dezenas de linhas

// COM Router — index.js limpo
app.use('/usuarios', usuariosRoutes)  // 4 rotas em uma linha
app.use('/produtos', produtosRoutes)  // outras 4 em uma linha
```

### Como o prefixo funciona

Quando você monta um router com `app.use('/usuarios', router)`, o Express **remove o prefixo** `/usuarios` antes de passar para o router. Por isso, dentro do arquivo de rotas, você escreve apenas o que vem depois de `/usuarios`:

```
URL real:              POST /usuarios
app.use('/usuarios', router) → router recebe:  POST /
router.post('/')  → COMBINA ✓

URL real:              GET /usuarios/5/editar
app.use('/usuarios', router) → router recebe:  GET /5/editar
router.get('/:id/editar')  → COMBINA ✓
```

---

## Criando `routes/usuariosRoutes.js`

Crie o arquivo `routes/usuariosRoutes.js`:

```js
const express = require('express')
const router = express.Router()

const usuarioController = require('../controllers/usuarioController')

router.post('/', usuarioController.criarUsuario)

module.exports = router
```

Analisando cada parte:

---

### `const router = express.Router()`

```js
const router = express.Router()
```

**`express.Router()`** cria um novo objeto de roteador. Esse objeto tem os mesmos métodos que `app`: `router.get()`, `router.post()`, `router.use()`.

**Retorna** um objeto router vazio, sem rotas definidas ainda.

---

### `require('../controllers/usuarioController')`

```js
const usuarioController = require('../controllers/usuarioController')
```

Importa o controller. `../` sobe de `routes/` para a raiz, depois entra em `controllers/`.

`usuarioController` será o objeto `{ criarUsuario }` exportado pelo controller.

---

### `router.post('/', usuarioController.criarUsuario)`

```js
router.post('/', usuarioController.criarUsuario)
```

Define que quando uma requisição `POST /` chegar neste router, a função `usuarioController.criarUsuario` deve ser executada.

**Repare:** a URL é `'/'`, não `'/usuarios'`. O prefixo `/usuarios` já está no `app.use()` do `index.js`. O router só precisa da parte depois do prefixo.

**`usuarioController.criarUsuario`** é passado **sem parênteses** — estamos passando a referência da função, não chamando ela. O Express vai chamá-la quando a requisição chegar, passando `req` e `res` como argumentos.

```js
// CORRETO — passa a referência da função (Express chama quando necessário)
router.post('/', usuarioController.criarUsuario)

// ERRADO — chama a função imediatamente (durante o registro da rota)
router.post('/', usuarioController.criarUsuario())
```

---

### `module.exports = router`

```js
module.exports = router
```

Exporta o router (com todas as rotas registradas) para ser importado e montado no `index.js`.

---

## Atualizando `index.js`

Agora atualizamos o `index.js` para:
- Remover a rota `POST /usuarios` antiga (substituída pelo router)
- Importar e montar o `usuariosRoutes`
- Remover o `require` do model (que estava lá só para o teste)

```js
const express = require('express')
const path = require('path')

require('./config/database')

const usuarioRoutes = require('./routes/usuariosRoutes')

const app = express()
const port = 8000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use('/usuarios', usuarioRoutes)

// Rota de teste — será removida na Aula 6
app.get('/teste-listar', (req, res) => {
    const usuarioModel = require('./models/usuarioModel')
    usuarioModel.listarUsuarios((erro, usuarios) => {
        if (erro) return res.send('Erro: ' + erro.message)
        res.json(usuarios)
    })
})

app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

### Por que `app.use('/usuarios', usuarioRoutes)` e não `app.get`?

```js
app.use('/usuarios', usuarioRoutes)
```

**`app.use()`** com dois argumentos monta um router em um prefixo. Ele aceita qualquer método HTTP (GET, POST, etc.) — o router interno cuida de diferenciar.

Se usássemos `app.get('/usuarios', ...)`, só funcionaria para GET. Como o router tem rotas POST, GET e outras, precisamos do `app.use()`.

---

## Testando o sistema completo

Reinicie o servidor e acesse `http://localhost:8000/formulario.html`. Preencha todos os campos e clique em "Cadastrar".

O que deve acontecer:
1. O browser envia `POST /usuarios` com os dados do formulário
2. O servidor redireciona para `/`
3. A página inicial abre

Para confirmar que o usuário foi salvo, acesse `http://localhost:8000/teste-listar`. O novo usuário deve aparecer no JSON.

Você também pode confirmar diretamente no MySQL Workbench:
```sql
SELECT * FROM usuarios;
```

---

## Rastreando um campo do HTML até o banco de dados

Veja o caminho completo que o campo "Nome" percorre, do HTML até o MySQL:

**1. HTML (`formulario.html`)**
```html
<input type="text" name="nome" value="João Silva">
```
O atributo `name="nome"` define a chave.

**2. Requisição HTTP (enviada pelo browser)**
```
POST /usuarios
nome=Jo%C3%A3o%20Silva&email=joao@email.com&...
```
O browser codifica os dados para envio.

**3. Middleware `express.urlencoded()` (em `index.js`)**
```js
req.body = { nome: 'João Silva', email: 'joao@email.com', ... }
```
O middleware decodifica e monta o objeto.

**4. Controller (`usuarioController.js`)**
```js
usuarioModel.criarUsuario(req.body, callback)
// req.body é o objeto { nome: 'João Silva', ... }
// passado como parâmetro 'usuario' ao model
```

**5. Model (`usuarioModel.js`)**
```js
function criarUsuario(usuario, callback) {
    // usuario.nome === 'João Silva'
    conexao.query(sql, [usuario.nome, usuario.email, ...], callback)
}
```

**6. mysql2 monta e envia o SQL**
```sql
INSERT INTO usuarios (nome, email, ...)
VALUES ('João Silva', 'joao@email.com', ...)
```
O `?` é substituído pelo valor real, com escape automático.

**7. MySQL armazena o registro**
```
| id | nome       | email          | ... |
|----|------------|----------------|-----|
| 1  | João Silva | joao@email.com | ... |
```

---

## Visualizando o fluxo completo da requisição

```
Usuário preenche formulario.html e clica em "Cadastrar"
        ↓
Browser envia POST /usuarios com os dados no body
        ↓
index.js: app.use('/usuarios', usuarioRoutes)
        ↓  Express remove o prefixo, passa POST / para o router
routes/usuariosRoutes.js: router.post('/', usuarioController.criarUsuario)
        ↓  Express chama a função passando (req, res)
controllers/usuarioController.js: criarUsuario(req, res)
        ↓  extrai req.body e chama o model
models/usuarioModel.js: criarUsuario(usuario, callback)
        ↓  monta o SQL e chama conexao.query
mysql2 → MySQL: INSERT INTO usuarios (...) VALUES (...)
        ↓  MySQL executa e confirma
mysql2 chama o callback com (null, { insertId: 1, affectedRows: 1 })
        ↓
controllers/usuarioController.js: callback recebe (erro=null)
        ↓  sem erro → chama res.redirect('/')
Express envia HTTP 302 para o browser
        ↓
Browser recebe o redirecionamento e faz GET /
        ↓
Express responde com public/index.html
        ↓
Página inicial aparece no browser
```

---

## A cadeia de imports

É importante visualizar como os arquivos se conectam:

```
index.js
    └── require('./routes/usuariosRoutes')
            └── require('../controllers/usuarioController')
                    └── require('../models/usuarioModel')
                                └── require('../config/database')
                                            └── mysql2
```

Cada camada importa apenas a que está abaixo dela. O `index.js` não conhece o model diretamente — ele só conhece as rotas. As rotas conhecem o controller. O controller conhece o model. O model conhece a conexão.

---

## Revisão — responsabilidades de cada arquivo

| Arquivo | Responsabilidade | Conhece |
|---------|-----------------|---------|
| `public/formulario.html` | Coleta dados do usuário | Nada do backend |
| `routes/usuariosRoutes.js` | Mapeia URLs para funções | O controller |
| `controllers/usuarioController.js` | Coordena req → model → res | O model e o Express |
| `models/usuarioModel.js` | Executa SQL | A conexão e o MySQL |
| `config/database.js` | Conecta ao banco | O mysql2 |

---

## Recapitulação

### O que aprendemos

- O papel do controller no MVC: coordenar a requisição entre View, Model e resposta
- Por que o model não deve receber `req` ou `res` diretamente — ele deve ser independente do Express
- Como `req.body` do controller mapeia para o parâmetro `usuario` do model via atributos `name` do HTML
- Por que usar `return res.send()` (e não apenas `res.send()`) para interromper o fluxo ao tratar erros
- O que é `express.Router()` e por que ele é usado em vez de definir todas as rotas em `index.js`
- Como o prefixo do `app.use('/usuarios', router)` funciona: o Express remove o prefixo antes de passar ao router
- Por que passamos `usuarioController.criarUsuario` sem parênteses para o router (referência vs. chamada)
- A diferença entre `app.use()` com prefixo (monta um router) e `app.get/post()` (define uma rota direta)
- O caminho completo de um campo HTML até o banco de dados: `name` → `req.body` → `usuario.campo` → `?` no SQL

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `controllers/usuarioController.js` | Função `criarUsuario` que lê `req.body`, chama o model e redireciona |
| `routes/usuariosRoutes.js` | Rota `POST /` mapeada para `usuarioController.criarUsuario` |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `index.js` | Removida rota `POST /usuarios` inline; importado e montado `usuarioRoutes` em `/usuarios` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET /                 → public/index.html                    ✓
→ GET /formulario.html  → servido como estático                ✓
→ POST /usuarios        → salva no banco e redireciona para /  ✓  ← novidade
→ GET /teste-listar     → lista usuários em JSON               ✓  (temporário)
```

**O que o fluxo MVC agora cobre:**
```
formulario.html → POST /usuarios → usuariosRoutes → usuarioController → usuarioModel → MySQL ✓
```

**O que ainda falta:** após cadastrar, o usuário é redirecionado para a página inicial — mas não há como ver a lista de usuários em uma interface. Isso é o painel ADM, que construiremos na próxima aula.

---

## Na próxima aula

Na **Aula 6** vamos construir o painel administrativo:
- Criar a rota `GET /adm` no `admRoutes.js`
- Criar o `admController.js` que busca usuários do banco e gera HTML dinâmico
- Entender como gerar HTML no servidor com template strings
- Ver a lista de usuários cadastrados em uma tabela HTML
- Trocar o `res.redirect('/')` por `res.redirect('/adm')` após o cadastro
