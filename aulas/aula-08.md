# Aula 8 — CRUD de Produtos e o Painel ADM Completo

## Revisão da Aula 7

Na aula anterior:
- Completamos o CRUD de usuários com Editar e Excluir
- Aprendemos SQL `UPDATE ... SET ... WHERE id = ?` e `DELETE FROM ... WHERE id = ?`
- Usamos o operador ternário para pré-preencher `checked` e `selected` no formulário de edição
- Aprendemos que `resultados[0]` é necessário porque o mysql2 sempre retorna array

O CRUD de usuários está completo. Agora aplicamos o **mesmo padrão** para produtos.

---

## Reconhecendo um padrão

Uma das habilidades mais importantes no desenvolvimento é reconhecer um padrão e replicá-lo para um novo contexto. Tudo que construímos para usuários nas Aulas 4 a 7 segue uma estrutura previsível:

```
model.js     → funções que executam SQL
controller.js → funções que conectam req/res ao model
routes.js    → mapeia URLs para funções do controller
index.js     → monta o router com um prefixo
```

Para produtos, fazemos exatamente a mesma coisa — com campos diferentes. Ao final desta aula, você terá internalizado esse padrão a ponto de conseguir criar um CRUD de qualquer entidade.

---

## A tabela `produtos` e seus campos

A tabela de produtos tem 4 campos além do `id`:

| Campo | Tipo SQL | Tipo JS (via mysql2) | O que armazena |
|-------|----------|---------------------|----------------|
| `nome` | `VARCHAR(150)` | string | Nome do produto |
| `preco` | `DECIMAL(10,2)` | **string** | Preço com 2 casas decimais |
| `quantidade` | `INT` | number | Estoque disponível |
| `categoria` | `VARCHAR(100)` | string ou null | Categoria opcional |

### Por que `DECIMAL` retorna string no mysql2?

O tipo `DECIMAL(10,2)` armazena números decimais com precisão exata (diferente de `FLOAT`, que tem erros de arredondamento). Porém, o mysql2 entrega valores `DECIMAL` como **strings** para o JavaScript, não como números.

Por quê? Porque o JavaScript usa ponto flutuante de 64 bits (IEEE 754), que não consegue representar todos os decimais com precisão exata:

```js
0.1 + 0.2 === 0.3   // false no JavaScript!
0.1 + 0.2            // 0.30000000000000004
```

Para evitar que valores monetários sejam corrompidos por esse problema, o mysql2 entrega `DECIMAL` como string e deixa a decisão de como tratar o número para o desenvolvedor.

Na prática: quando o banco retornar o preço `29.90`, `p.preco` será a string `'29.90'`, não o número `29.9`.

---

## `Number()` e `toFixed()` — formatando preços

Para exibir o preço na tabela do painel, precisamos converter e formatar:

```js
Number(p.preco).toFixed(2)
```

**`Number(valor)`** — converte qualquer valor para número:
```js
Number('29.90')   // 29.9
Number('0')       // 0
Number('')        // 0
Number('abc')     // NaN (Not a Number — valor inválido)
```

**`numero.toFixed(casas)`** — formata um número com um número fixo de casas decimais, retornando uma string:
```js
(29.9).toFixed(2)    // '29.90'
(29.0).toFixed(2)    // '29.00'
(29.999).toFixed(2)  // '30.00' (arredonda)
```

Combinados:
```js
Number('29.9').toFixed(2)   // '29.90'
Number('100').toFixed(2)    // '100.00'
```

Na tabela do painel, exibiremos: `R$ ${Number(p.preco).toFixed(2)}`

---

## O `<input type="number">` e seus atributos

O formulário de produtos usa campos numéricos que o HTML trata de forma especial:

```html
<input type="number" name="preco" step="0.01" min="0" required>
```

- **`type="number"`** — o browser renderiza controles de incremento/decremento e recusa letras. Ao enviar o formulário, o valor chega em `req.body` como **string** (o Express não converte tipos).
- **`step="0.01"`** — define o incremento dos botões e a precisão aceita. Com `step="0.01"`, o campo aceita `29.99` mas recusaria `29.999`. Para preços, sempre use `step="0.01"`.
- **`min="0"`** — impede que o usuário insira valores negativos via interface.

```html
<input type="number" name="quantidade" min="0" required>
```

Para quantidade, não usamos `step` (o padrão é `1` — números inteiros).

---

## Parte 1 — `models/produtoModel.js`

Crie o arquivo `models/produtoModel.js`:

```js
const conexao = require('../config/database')

function criarProduto(produto, callback) {
    const sql = `
        INSERT INTO produtos (nome, preco, quantidade, categoria)
        VALUES (?, ?, ?, ?)
    `
    conexao.query(sql, [
        produto.nome,
        produto.preco,
        produto.quantidade,
        produto.categoria
    ], callback)
}

function listarProdutos(callback) {
    const sql = `SELECT * FROM produtos ORDER BY nome`
    conexao.query(sql, callback)
}

function buscarProdutoPorId(id, callback) {
    const sql = `SELECT * FROM produtos WHERE id = ?`
    conexao.query(sql, [id], callback)
}

function atualizarProduto(id, dados, callback) {
    const sql = `
        UPDATE produtos
        SET nome = ?, preco = ?, quantidade = ?, categoria = ?
        WHERE id = ?
    `
    conexao.query(sql, [
        dados.nome,
        dados.preco,
        dados.quantidade,
        dados.categoria,
        id
    ], callback)
}

function deletarProduto(id, callback) {
    const sql = `DELETE FROM produtos WHERE id = ?`
    conexao.query(sql, [id], callback)
}

module.exports = {
    criarProduto,
    listarProdutos,
    buscarProdutoPorId,
    atualizarProduto,
    deletarProduto
}
```

O padrão é idêntico ao `usuarioModel.js`. A única diferença está nos campos (`nome`, `preco`, `quantidade`, `categoria`) e no SQL correspondente.

---

## Parte 2 — `public/produto.html`

O arquivo `produto.html` deve enviar os dados de cadastro para `POST /produtos`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastrar Produto</title>
</head>
<body>

    <h1>Cadastrar Produto</h1>

    <form action="/produtos" method="POST">

        <label>Nome do produto:</label>
        <input type="text" name="nome" required>
        <br><br>

        <label>Preço:</label>
        <input type="number" name="preco" step="0.01" min="0" required>
        <br><br>

        <label>Quantidade em estoque:</label>
        <input type="number" name="quantidade" min="0" required>
        <br><br>

        <label>Categoria:</label>
        <input type="text" name="categoria">
        <br><br>

        <button type="submit">Cadastrar</button>

    </form>

    <br>
    <a href="/adm">Voltar ao painel</a>

</body>
</html>
```

Pontos importantes:
- **`action="/produtos"`** — envia para a rota `POST /produtos` que criaremos no router
- **`name="preco"`** → `req.body.preco` chegará como string `'29.90'` — o mysql2 aceita strings em campos `DECIMAL`
- **`name="categoria"`** sem `required` — campo opcional, pode ser enviado vazio

---

## Parte 3 — `controllers/produtoController.js`

Crie o arquivo `controllers/produtoController.js`:

```js
const produtoModel = require('../models/produtoModel')

function criarProduto(req, res) {
    produtoModel.criarProduto(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar produto.')
        }
        res.redirect('/adm')
    })
}

function mostrarFormularioEdicao(req, res) {
    const { id } = req.params

    produtoModel.buscarProdutoPorId(id, (erro, resultados) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao buscar produto.')
        }
        if (resultados.length === 0) {
            return res.send('Produto não encontrado.')
        }

        const p = resultados[0]

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editar Produto</title>
            </head>
            <body>

                <h1>Editar Produto</h1>

                <form action="/produtos/${p.id}/editar" method="POST">

                    <label>Nome do produto:</label>
                    <input type="text" name="nome" value="${p.nome}" required>
                    <br><br>

                    <label>Preço:</label>
                    <input type="number" name="preco" value="${p.preco}" step="0.01" min="0" required>
                    <br><br>

                    <label>Quantidade em estoque:</label>
                    <input type="number" name="quantidade" value="${p.quantidade}" min="0" required>
                    <br><br>

                    <label>Categoria:</label>
                    <input type="text" name="categoria" value="${p.categoria || ''}">
                    <br><br>

                    <button type="submit">Salvar alterações</button>

                </form>

                <br>
                <a href="/adm">Voltar ao painel</a>

            </body>
            </html>
        `

        res.send(html)
    })
}

function atualizarProduto(req, res) {
    const { id } = req.params

    produtoModel.atualizarProduto(id, req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao atualizar produto.')
        }
        res.redirect('/adm')
    })
}

function deletarProduto(req, res) {
    const { id } = req.params

    produtoModel.deletarProduto(id, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao excluir produto.')
        }
        res.redirect('/adm')
    })
}

module.exports = {
    criarProduto,
    mostrarFormularioEdicao,
    atualizarProduto,
    deletarProduto
}
```

O valor de `p.preco` em `value="${p.preco}"` é a string `'29.90'` retornada pelo mysql2. O browser aceita strings numéricas em `<input type="number">` e as exibe corretamente — sem necessidade de converter aqui.

---

## Parte 4 — `routes/produtosRoutes.js`

Crie `routes/produtosRoutes.js`:

```js
const express = require('express')
const router = express.Router()

const produtoController = require('../controllers/produtoController')

router.post('/', produtoController.criarProduto)
router.get('/:id/editar', produtoController.mostrarFormularioEdicao)
router.post('/:id/editar', produtoController.atualizarProduto)
router.post('/:id/deletar', produtoController.deletarProduto)

module.exports = router
```

Idêntico ao `usuariosRoutes.js`, apenas usando `produtoController`.

---

## Parte 5 — Callbacks aninhados no painel ADM

O painel ADM agora precisa exibir **duas tabelas**: usuários e produtos. Isso exige buscar dados de duas fontes diferentes antes de montar o HTML.

O desafio: as duas consultas ao banco são **operações assíncronas**. Não podemos simplesmente chamar `listarUsuarios` e `listarProdutos` em sequência e esperar que ambas terminem — o Node.js não garante que a segunda termine após a primeira.

A solução é **aninhar os callbacks**: chamar `listarProdutos` dentro do callback de `listarUsuarios`. Assim, a segunda consulta só começa quando a primeira já terminou e entregou seus resultados.

```
listarUsuarios é chamado
        ↓  (espera o banco...)
callback de listarUsuarios é executado com os usuários
        ↓
  listarProdutos é chamado (agora temos os usuários em mãos)
          ↓  (espera o banco...)
  callback de listarProdutos é executado com os produtos
          ↓
    Aqui temos AMBOS: usuarios e produtos
    Podemos montar o HTML e enviar a resposta
```

Abra `controllers/admController.js` e substitua o conteúdo:

```js
const usuarioModel = require('../models/usuarioModel')
const produtoModel = require('../models/produtoModel')

function painelAdm(req, res) {
    usuarioModel.listarUsuarios((erroU, usuarios) => {
        if (erroU) {
            console.log(erroU)
            return res.send('Erro ao carregar usuários.')
        }

        produtoModel.listarProdutos((erroP, produtos) => {
            if (erroP) {
                console.log(erroP)
                return res.send('Erro ao carregar produtos.')
            }

            const linhasUsuarios = usuarios.map(u => `
                <tr>
                    <td>${u.id}</td>
                    <td>${u.nome}</td>
                    <td>${u.email}</td>
                    <td>${u.telefone || '—'}</td>
                    <td>${u.cidade || '—'}</td>
                    <td>${u.estado || '—'}</td>
                    <td>
                        <a href="/usuarios/${u.id}/editar">Editar</a>
                        <form action="/usuarios/${u.id}/deletar" method="POST" style="display:inline">
                            <button type="submit">Excluir</button>
                        </form>
                    </td>
                </tr>
            `).join('')

            const linhasProdutos = produtos.map(p => `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nome}</td>
                    <td>R$ ${Number(p.preco).toFixed(2)}</td>
                    <td>${p.quantidade}</td>
                    <td>${p.categoria || '—'}</td>
                    <td>
                        <a href="/produtos/${p.id}/editar">Editar</a>
                        <form action="/produtos/${p.id}/deletar" method="POST" style="display:inline">
                            <button type="submit">Excluir</button>
                        </form>
                    </td>
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

                    <h2>Usuários (${usuarios.length})</h2>
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
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasUsuarios}
                        </tbody>
                    </table>

                    <hr>

                    <h2>Produtos (${produtos.length})</h2>
                    <a href="/produto.html">+ Novo produto</a>
                    <br><br>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>Preço</th>
                                <th>Quantidade</th>
                                <th>Categoria</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasProdutos}
                        </tbody>
                    </table>

                </body>
                </html>
            `

            res.send(html)
        })
    })
}

module.exports = {
    painelAdm
}
```

### Entendendo o aninhamento de callbacks

Visualmente, o código tem dois níveis de indentação de callbacks:

```
painelAdm(req, res) {
    listarUsuarios((erroU, usuarios) => {        ← 1º callback (nível 1)
        if (erroU) return ...

        listarProdutos((erroP, produtos) => {    ← 2º callback (nível 2)
            if (erroP) return ...

            // ← aqui temos acesso a AMBOS: usuarios e produtos
            const linhasUsuarios = ...
            const linhasProdutos = ...
            const html = ...
            res.send(html)                       ← resposta enviada aqui
        })
    })
}
```

O `res.send(html)` fica no nível mais interno porque ele precisa dos dados de **ambas** as consultas. Tentar enviar a resposta fora do segundo callback significaria tentar usar `produtos` antes dele estar disponível.

### Uma nota sobre escalabilidade

O aninhamento de callbacks funciona bem com duas ou três consultas. Se precisássemos de cinco ou seis, o código ficaria muito indentado — isso é chamado de **callback hell**. A solução moderna é usar `Promises` e `async/await`, que tornam código assíncrono parecido com código síncrono. Para este projeto de estudo, callbacks aninhados são suficientes e adequados para aprender o conceito.

---

## Parte 6 — Atualizando `index.js`

Adicione o import e o mount de `produtosRoutes`:

```js
const express = require('express')
const path = require('path')

require('./config/database')

const usuarioRoutes = require('./routes/usuariosRoutes')
const admRoutes = require('./routes/admRoutes')
const produtoRoutes = require('./routes/produtosRoutes')    // ← adicione

const app = express()
const port = 8000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.use('/usuarios', usuarioRoutes)
app.use('/adm', admRoutes)
app.use('/produtos', produtoRoutes)                         // ← adicione

app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

---

## Testando o CRUD de produtos

Reinicie o servidor:

```bash
node index.js
```

### Teste 1 — Cadastrar produto
Acesse `http://localhost:8000/produto.html`. Preencha os campos e clique em "Cadastrar". O painel deve abrir com o produto na tabela de produtos.

### Teste 2 — Verificar formatação de preço
Se você cadastrou `29.9`, o painel deve exibir `R$ 29.90` (com duas casas decimais).

### Teste 3 — Editar produto
Clique em "Editar" de um produto. O formulário deve abrir com os valores atuais. Altere o preço e salve.

### Teste 4 — Excluir produto
Clique em "Excluir" de um produto. Ele deve desaparecer da tabela imediatamente.

### Teste 5 — Confirmar no banco
```sql
SELECT * FROM produtos;
```

---

## Visualizando o fluxo completo do `GET /adm`

```
Browser acessa GET /adm
        ↓
admController.painelAdm(req, res)
        ↓
usuarioModel.listarUsuarios(callback1)
        ↓  banco responde com [{ id:1, nome:'João', ... }, ...]
callback1 executado com (null, usuarios)
        ↓
  produtoModel.listarProdutos(callback2)
          ↓  banco responde com [{ id:1, nome:'Notebook', preco:'3999.00', ... }, ...]
  callback2 executado com (null, produtos)
          ↓
  linhasUsuarios = usuarios.map(...).join('')
  linhasProdutos = produtos.map(p => `R$ ${Number(p.preco).toFixed(2)}`...).join('')
  html = `...${linhasUsuarios}...${linhasProdutos}...`
          ↓
  res.send(html)
          ↓
Browser recebe o HTML com as duas tabelas preenchidas
```

---

## Tabela de rotas completas do sistema

| Método | URL | O que faz |
|--------|-----|-----------|
| `GET` | `/` | Página inicial (login) |
| `GET` | `/formulario.html` | Formulário de cadastro de usuário (estático) |
| `GET` | `/produto.html` | Formulário de cadastro de produto (estático) |
| `GET` | `/adm` | Painel ADM com tabelas de usuários e produtos |
| `POST` | `/usuarios` | Cria usuário |
| `GET` | `/usuarios/:id/editar` | Formulário pré-preenchido do usuário |
| `POST` | `/usuarios/:id/editar` | Atualiza usuário |
| `POST` | `/usuarios/:id/deletar` | Exclui usuário |
| `POST` | `/produtos` | Cria produto |
| `GET` | `/produtos/:id/editar` | Formulário pré-preenchido do produto |
| `POST` | `/produtos/:id/editar` | Atualiza produto |
| `POST` | `/produtos/:id/deletar` | Exclui produto |

---

## Recapitulação

### O que aprendemos

- Como reconhecer um padrão MVC já aprendido e aplicá-lo para uma nova entidade sem reinventar
- O tipo SQL `DECIMAL(10,2)` e por que o mysql2 retorna valores `DECIMAL` como string
- `Number(valor)` para converter string para número e `.toFixed(casas)` para formatar com casas decimais fixas
- `<input type="number">` com `step="0.01"` para campos de preço e `min="0"` para impedir negativos
- Callbacks aninhados: como executar duas consultas assíncronas em sequência e aguardar ambas antes de montar a resposta
- Por que o `res.send(html)` deve ficar no callback mais interno — ele precisa dos dados de todas as consultas anteriores
- O conceito de "callback hell" e que Promises/async-await são a solução moderna

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `models/produtoModel.js` | CRUD completo de produtos: criar, listar, buscar por ID, atualizar, deletar |
| `controllers/produtoController.js` | 4 funções: criarProduto, mostrarFormularioEdicao, atualizarProduto, deletarProduto |
| `routes/produtosRoutes.js` | 4 rotas: POST /, GET /:id/editar, POST /:id/editar, POST /:id/deletar |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `controllers/admController.js` | Importado `produtoModel`; callbacks aninhados; segunda tabela de produtos no HTML |
| `index.js` | Importado e montado `produtoRoutes` em `/produtos` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET  /adm                    → painel com usuários E produtos      ✓
→ POST /usuarios               → cria usuário → /adm                 ✓
→ GET  /usuarios/:id/editar    → formulário usuário pré-preenchido   ✓
→ POST /usuarios/:id/editar    → atualiza usuário → /adm             ✓
→ POST /usuarios/:id/deletar   → exclui usuário → /adm               ✓
→ POST /produtos               → cria produto → /adm                 ✓  ← novo
→ GET  /produtos/:id/editar    → formulário produto pré-preenchido   ✓  ← novo
→ POST /produtos/:id/editar    → atualiza produto → /adm             ✓  ← novo
→ POST /produtos/:id/deletar   → exclui produto → /adm              ✓  ← novo
```

**CRUDs completos:**

```
Usuários:  Create ✓  Read ✓  Update ✓  Delete ✓
Produtos:  Create ✓  Read ✓  Update ✓  Delete ✓
```

O sistema tem agora funcionalidade completa. As próximas aulas adicionam qualidade: CSS para estilizar o painel, busca/filtragem e JavaScript do lado do cliente.

---

## Na próxima aula

Na **Aula 9** vamos estilizar o painel administrativo com CSS:
- O que é `express.static()` e como ele serve arquivos CSS para o painel dinâmico
- Criar `public/css/style.css` com layout sidebar + conteúdo principal
- CSS Flexbox para organizar o painel
- Aplicar classes nos elementos HTML gerados pelo controller
- Como linkar um CSS externo numa página gerada dinamicamente por `res.send()`
