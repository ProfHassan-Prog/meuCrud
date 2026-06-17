# Aula 6 — Painel ADM: Listando Dados Dinâmicos

## Revisão da Aula 5

Na aula anterior:
- Criamos `controllers/usuarioController.js` com a função `criarUsuario`
- Criamos `routes/usuariosRoutes.js` com a rota `POST /`
- Aprendemos o que é `express.Router()` e como o prefixo de URL funciona
- Montamos as rotas no `index.js` com `app.use('/usuarios', usuarioRoutes)`
- O formulário agora salva usuários reais no banco de dados

O problema atual: após cadastrar um usuário, somos redirecionados para a página inicial — sem ter como ver os usuários cadastrados. Precisamos de um **painel administrativo** que busque os dados do banco e os exiba em uma tabela HTML.

---

## O problema: dados dinâmicos em HTML

Até agora, servimos páginas HTML como arquivos estáticos com `express.static()` ou `res.sendFile()`. Isso funciona para páginas fixas — mas **não funciona** quando o conteúdo muda conforme os dados do banco.

Por exemplo, a lista de usuários depende do que está no banco naquele momento. Não é possível saber antecipadamente quais usuários estarão cadastrados para escrever o HTML com antecedência.

A solução é **renderização server-side**: o servidor busca os dados no banco, monta o HTML com esses dados e **só então** envia a página ao browser.

```
Renderização estática (arquivo em disco):
servidor → lê arquivo HTML fixo → envia ao browser

Renderização server-side (gerada dinamicamente):
servidor → busca dados no banco → monta HTML com os dados → envia ao browser
```

Essa é exatamente a responsabilidade do **controller do ADM**: buscar os dados e montar o HTML.

---

## Template strings para gerar HTML

Em JavaScript, **template strings** (strings com crases `` ` `` ) permitem duas coisas que strings normais não permitem:

### 1. Interpolação de variáveis com `${}`

```js
const nome = 'João'
const cidade = 'Curitiba'

// String normal — não interpola
const msg1 = 'Olá, ' + nome + '! Você é de ' + cidade + '.'

// Template string — interpola com ${}
const msg2 = `Olá, ${nome}! Você é de ${cidade}.`

// Ambas produzem: "Olá, João! Você é de Curitiba."
```

Dentro de `${}` você pode colocar qualquer expressão JavaScript: variáveis, operações, chamadas de função, operador ternário.

### 2. Strings com múltiplas linhas

```js
// String normal — precisa de \n para quebrar linha
const html1 = '<table>\n  <tr>\n    <td>João</td>\n  </tr>\n</table>'

// Template string — quebra de linha real
const html2 = `
    <table>
        <tr>
            <td>João</td>
        </tr>
    </table>
`
```

Combinando as duas capacidades, conseguimos montar HTML completo com dados dinâmicos de forma legível:

```js
const usuario = { id: 1, nome: 'João', email: 'joao@email.com' }

const html = `
    <tr>
        <td>${usuario.id}</td>
        <td>${usuario.nome}</td>
        <td>${usuario.email}</td>
    </tr>
`
```

---

## `Array.map()` e `Array.join()`

Para transformar uma **lista de usuários** (array de objetos) em **linhas de tabela HTML** (string), usamos dois métodos encadeados.

### `Array.map(função)`

`map()` percorre cada elemento do array, aplica uma função de transformação e retorna um **novo array** com os resultados.

```js
const numeros = [1, 2, 3]
const dobros = numeros.map(n => n * 2)
// dobros = [2, 4, 6]
// numeros não foi alterado
```

Aplicado a usuários:

```js
const usuarios = [
    { id: 1, nome: 'João', email: 'joao@email.com' },
    { id: 2, nome: 'Maria', email: 'maria@email.com' }
]

const linhas = usuarios.map(u => `<tr><td>${u.id}</td><td>${u.nome}</td></tr>`)
// linhas = [
//   '<tr><td>1</td><td>João</td></tr>',
//   '<tr><td>2</td><td>Maria</td></tr>'
// ]
```

`map()` recebe uma função como argumento. Essa função é chamada para **cada elemento** do array, recebendo o elemento atual como parâmetro (aqui chamamos de `u`). O retorno de cada chamada vira um elemento do novo array.

### `Array.join(separador)`

`join()` une todos os elementos de um array em uma única string, separando-os pelo separador fornecido.

```js
['a', 'b', 'c'].join('-')   // 'a-b-c'
['a', 'b', 'c'].join(', ')  // 'a, b, c'
['a', 'b', 'c'].join('')    // 'abc'
```

Usamos `join('')` (separador vazio) para colar as linhas HTML sem nada entre elas:

```js
const linhas = ['<tr><td>João</td></tr>', '<tr><td>Maria</td></tr>']
const linhasUnidas = linhas.join('')
// '<tr><td>João</td></tr><tr><td>Maria</td></tr>'
```

### Encadeando `map().join()`

Na prática, encadeamos os dois diretamente:

```js
const linhasUsuarios = usuarios.map(u => `
    <tr>
        <td>${u.id}</td>
        <td>${u.nome}</td>
    </tr>
`).join('')
```

Resultado: uma única string com todas as linhas `<tr>` prontas para inserir no `<tbody>` da tabela.

---

## O operador `||` como fallback

Campos opcionais do banco de dados podem ser `null` quando não foram preenchidos. Exibir `null` em uma tabela HTML fica feio e confuso para o usuário.

O operador `||` resolve isso:

```js
u.telefone || '—'
```

**Como `||` funciona:** retorna o primeiro valor "verdadeiro" (truthy). Se o valor da esquerda for falsy (`null`, `undefined`, `''`, `0`, `false`), retorna o valor da direita.

```js
null || '—'              // '—'    (null é falsy)
undefined || '—'         // '—'    (undefined é falsy)
'' || '—'                // '—'    (string vazia é falsy)
'(45) 99999-9999' || '—' // '(45) 99999-9999'  (string com conteúdo é truthy)
```

Aplicado nas células da tabela:

```js
<td>${u.telefone || '—'}</td>
<td>${u.cidade || '—'}</td>
<td>${u.estado || '—'}</td>
```

Se o campo não foi preenchido no cadastro, o banco retorna `null`, e exibimos `'—'` no lugar.

---

## Passo 1 — Criando `routes/admRoutes.js`

Crie o arquivo `routes/admRoutes.js`:

```js
const express = require('express')
const router = express.Router()

const admController = require('../controllers/admController')

router.get('/', admController.painelAdm)

module.exports = router
```

Simples: uma única rota `GET /` que chama `admController.painelAdm`. Quando montada em `/adm`, responde a `GET /adm`.

---

## Passo 2 — Criando `controllers/admController.js`

Crie o arquivo `controllers/admController.js`:

```js
const usuarioModel = require('../models/usuarioModel')

function painelAdm(req, res) {
    usuarioModel.listarUsuarios((erro, usuarios) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao carregar o painel.')
        }

        const linhasUsuarios = usuarios.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.telefone || '—'}</td>
                <td>${u.cidade || '—'}</td>
                <td>${u.estado || '—'}</td>
            </tr>
        `).join('')

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Painel ADM</title>
            </head>
            <body>

                <h1>Painel Administrativo</h1>

                <h2>Usuários cadastrados (${usuarios.length})</h2>

                <a href="/formulario.html">+ Novo usuário</a>

                <br><br>

                <table border="1">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Telefone</th>
                            <th>Cidade</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${linhasUsuarios}
                    </tbody>
                </table>

            </body>
            </html>
        `

        res.send(html)
    })
}

module.exports = {
    painelAdm
}
```

Vamos analisar cada bloco em detalhes.

---

### `require('../models/usuarioModel')`

```js
const usuarioModel = require('../models/usuarioModel')
```

O controller do ADM importa o model de usuários para buscar os dados. O caminho `../` sobe de `controllers/` para a raiz e depois entra em `models/`.

---

### `function painelAdm(req, res)`

```js
function painelAdm(req, res) {
    usuarioModel.listarUsuarios((erro, usuarios) => {
        ...
    })
}
```

Esta função segue o mesmo padrão dos controllers anteriores: recebe `req` e `res` do Express.

A primeira coisa que ela faz é chamar `usuarioModel.listarUsuarios()`, passando um callback. Tudo que acontece depois — montar o HTML, enviar a resposta — está **dentro desse callback**, porque precisamos esperar o banco de dados responder antes de montar a página.

**Importante:** o código dentro do callback só executa quando o `SELECT` terminar. O Node.js continua disponível para outras requisições enquanto espera — isso é a natureza assíncrona do Node.js.

---

### Tratamento de erro

```js
if (erro) {
    console.log(erro)
    return res.send('Erro ao carregar o painel.')
}
```

Mesmo padrão visto no controller de usuários: logar o erro no terminal e encerrar a função com `return` antes de continuar para montar o HTML.

---

### Montando as linhas da tabela

```js
const linhasUsuarios = usuarios.map(u => `
    <tr>
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td>${u.telefone || '—'}</td>
        <td>${u.cidade || '—'}</td>
        <td>${u.estado || '—'}</td>
    </tr>
`).join('')
```

Por que montamos `linhasUsuarios` em uma variável separada, antes do HTML principal?

Porque inserir um `.map().join()` diretamente dentro de uma template string gigante fica confuso de ler. Pré-computar a parte dinâmica e depois inserir com `${linhasUsuarios}` deixa o código mais legível.

---

### `${usuarios.length}` no título

```js
<h2>Usuários cadastrados (${usuarios.length})</h2>
```

**`Array.length`** retorna o número de elementos do array — ou seja, a quantidade de usuários. Como `usuarios` é o array retornado pelo `SELECT`, `usuarios.length` é o total de usuários no banco.

Se não houver usuários, `usuarios.length` é `0` e a tabela terá o `<tbody>` vazio.

---

### `res.send(html)` vs `res.sendFile()`

```js
res.send(html)
```

Aqui usamos `res.send()` em vez de `res.sendFile()` porque o HTML não está em um arquivo — ele foi **construído em memória** pela função. `res.send()` envia qualquer string como resposta HTTP.

`res.sendFile()` lê um arquivo do disco e envia. `res.send()` envia uma string que já está na memória.

---

## Passo 3 — Atualizando `index.js`

Abra o `index.js` e faça três mudanças:
1. Importar `admRoutes`
2. Montar em `/adm`
3. Remover a rota de teste `/teste-listar`

```js
const express = require('express')
const path = require('path')

require('./config/database')

const usuarioRoutes = require('./routes/usuariosRoutes')
const admRoutes = require('./routes/admRoutes')        // ← adicione

const app = express()
const port = 8000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use('/usuarios', usuarioRoutes)
app.use('/adm', admRoutes)                            // ← adicione

// GET /teste-listar foi removido                     // ← remova

app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

---

## Passo 4 — Atualizando o redirect no `usuarioController.js`

Abra `controllers/usuarioController.js` e troque o redirect de `'/'` para `'/adm'`:

```js
function criarUsuario(req, res) {
    usuarioModel.criarUsuario(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar usuário.')
        }
        res.redirect('/adm')   // ← era '/', agora é '/adm'
    })
}
```

Agora, após cadastrar um usuário com sucesso, o browser vai direto para o painel e o novo usuário já aparece na tabela.

---

## Passo 5 — Testando

Reinicie o servidor:

```bash
node index.js
```

**Teste 1 — Ver o painel:**
Acesse `http://localhost:8000/adm`. A tabela deve aparecer com todos os usuários já cadastrados.

**Teste 2 — Cadastrar e ver:**
Acesse `http://localhost:8000/formulario.html`, preencha os campos e clique em "Cadastrar". O browser deve redirecionar para `/adm` e o novo usuário deve aparecer na última linha da tabela (ou em ordem alfabética, dependendo do `ORDER BY nome` do model).

**Teste 3 — Banco vazio:**
Se não houver usuários, o painel deve mostrar "Usuários cadastrados (0)" e uma tabela com cabeçalho mas sem linhas no `<tbody>`.

---

## Visualizando o fluxo completo

### Fluxo do GET /adm

```
Browser acessa http://localhost:8000/adm
        ↓
index.js: app.use('/adm', admRoutes)
        ↓  Express remove o prefixo /adm, passa GET / ao router
routes/admRoutes.js: router.get('/', admController.painelAdm)
        ↓  Express chama painelAdm(req, res)
controllers/admController.js: painelAdm(req, res)
        ↓  chama
models/usuarioModel.js: listarUsuarios(callback)
        ↓  executa
conexao.query('SELECT * FROM usuarios ORDER BY nome', callback)
        ↓
MySQL retorna as linhas da tabela
        ↓
mysql2 converte cada linha em objeto JavaScript
callback é chamado com: (null, [{ id:1, nome:'João', ... }, ...])
        ↓
admController: usuarios.map(u => '<tr>...</tr>').join('')
        ↓  monta linhasUsuarios
admController: monta html com template string, inserindo ${linhasUsuarios}
        ↓
res.send(html)
        ↓
Express envia o HTML com código 200
        ↓
Browser recebe o HTML e renderiza a tabela com os dados reais
```

### Fluxo após cadastrar usuário (POST → redirect → GET)

```
Usuário preenche formulario.html e clica em "Cadastrar"
        ↓
POST /usuarios → usuarioController.criarUsuario
        ↓
INSERT INTO usuarios ...
        ↓
MySQL confirma → callback chamado com (null, resultado)
        ↓
res.redirect('/adm')  → browser recebe 302
        ↓
Browser faz GET /adm  → admController.painelAdm
        ↓
SELECT * FROM usuarios  → retorna array incluindo o novo usuário
        ↓
HTML montado com o novo usuário na tabela
        ↓
Browser exibe a tabela atualizada
```

---

## Por que o HTML é montado no servidor e não no browser

Uma dúvida comum: "por que não enviar o JSON do banco para o browser e montar a tabela com JavaScript?"

Essa é uma abordagem válida (é o que React, Vue e Angular fazem). Mas nosso projeto segue o modelo **tradicional server-side**, onde o servidor entrega HTML pronto.

| | Server-side (nosso projeto) | Client-side (React/Vue) |
|--|---------------------------|------------------------|
| **Quem monta o HTML** | Servidor (Node.js) | Browser (JavaScript) |
| **O que o servidor envia** | HTML completo | JSON com dados |
| **Recarregamento** | Página inteira recarrega | Só parte da página atualiza |
| **Complexidade** | Menor, mais simples | Maior, mais poderoso |
| **Bom para aprender** | Conceitos fundamentais do HTTP | Frameworks modernos |

Para um sistema de estudos e para entender como a web funciona, o modelo server-side é mais didático.

---

## Recapitulação

### O que aprendemos

- O que é renderização server-side e por que usamos quando os dados são dinâmicos
- Como template strings permitem criar HTML com dados dinâmicos usando `${}` e múltiplas linhas
- `Array.map(função)` — transforma cada elemento de um array usando uma função e retorna um novo array
- `Array.join(separador)` — une todos os elementos de um array em uma única string
- Como encadear `.map().join('')` para transformar um array de objetos em uma string de HTML
- O operador `||` como fallback para valores `null` ou `undefined` vindos do banco
- `Array.length` para exibir a quantidade total de registros
- A diferença entre `res.send(string)` e `res.sendFile(caminho)`
- A diferença entre renderização server-side (nosso projeto) e client-side (React/Vue)

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `routes/admRoutes.js` | Rota `GET /` mapeada para `admController.painelAdm` |
| `controllers/admController.js` | Função `painelAdm` que busca usuários e monta HTML dinâmico |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `index.js` | Importado `admRoutes`, montado em `/adm`, removida rota de teste `/teste-listar` |
| `controllers/usuarioController.js` | `res.redirect('/')` trocado por `res.redirect('/adm')` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET /                → public/index.html                           ✓
→ GET /formulario.html → servido como estático                       ✓
→ POST /usuarios       → salva no banco → redireciona para /adm      ✓
→ GET /adm             → lista usuários em HTML dinâmico             ✓  ← novidade
```

**O que o MVC cobre agora:**

```
formulario.html → POST /usuarios → controller → model → MySQL   ✓  (criar)
GET /adm        → admController  → model → MySQL → HTML         ✓  (listar)
```

**O que ainda falta:**
- Botões de Editar e Excluir na tabela (Aula 7)
- CRUD de produtos (Aula 8)

---

## Na próxima aula

Na **Aula 7** vamos completar o CRUD de usuários com as operações de editar e excluir:
- Adicionar botões "Editar" e "Excluir" na tabela do painel
- Criar a rota `GET /usuarios/:id/editar` que exibe o formulário pré-preenchido
- Criar a rota `POST /usuarios/:id/editar` que salva as alterações com `UPDATE`
- Criar a rota `POST /usuarios/:id/deletar` que remove o registro com `DELETE`
- Adicionar as funções `buscarUsuarioPorId`, `atualizarUsuario` e `deletarUsuario` no model
