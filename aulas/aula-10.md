# Aula 10 — Busca e Filtragem no Painel ADM

## Revisão da Aula 9

Na aula anterior:
- Estilizamos o painel ADM com CSS — layout Flexbox, sidebar, tabelas e botões
- Aprendemos como `express.static()` serve CSS para páginas geradas dinamicamente
- Entendemos `border-collapse`, `overflow: hidden` com `border-radius`, pseudo-classes `:hover` e `:last-child`, e `transition`

O painel está visualmente pronto. Agora adicionamos **busca**: o administrador deve conseguir filtrar usuários e produtos por nome sem precisar rolar uma tabela longa.

---

## O que é a query string

Até agora, dados chegavam ao servidor de duas formas:
- **`req.params`** — valores embutidos na URL: `/usuarios/3/editar` → `req.params.id === '3'`
- **`req.body`** — valores enviados pelo corpo de requisições POST

Existe uma terceira forma: a **query string**, que fica no final da URL após o símbolo `?`:

```
http://localhost:8000/adm?busca_usuario=joão
                          ↑
                     query string
```

A query string é uma lista de pares `chave=valor` separados por `&`:

```
/adm?busca_usuario=joão&busca_produto=notebook
     ↑─────────────────↑────────────────────────
     par 1              par 2
```

### `req.query`

O Express parseia a query string automaticamente e a disponibiliza no objeto `req.query`:

```js
// URL: /adm?busca_usuario=joão&busca_produto=notebook

req.query.busca_usuario   // 'joão'
req.query.busca_produto   // 'notebook'

// URL: /adm  (sem query string)
req.query.busca_usuario   // undefined
req.query.busca_produto   // undefined
```

**Codificação de URL:** quando o usuário digita "João" com acento, o browser codifica para `Jo%C3%A3o` na URL. O Express decodifica automaticamente — `req.query.busca_usuario` chega como `'João'`, não como `'Jo%C3%A3o'`.

---

## GET vs. POST para formulários

Formulários HTML têm um atributo `method` que pode ser `GET` ou `POST`. Até agora usamos sempre `POST`. Para busca, usamos `GET`.

### Por que GET para busca?

```html
<!-- Busca — usa GET -->
<form method="GET" action="/adm">
    <input type="text" name="busca_usuario">
    <button type="submit">Buscar</button>
</form>

<!-- Cadastro — usa POST -->
<form method="POST" action="/usuarios">
    ...
</form>
```

| | GET | POST |
|--|-----|------|
| **Onde os dados vão** | Na URL como query string | No body da requisição |
| **URL resultante** | `/adm?busca_usuario=joão` | `/adm` (dados invisíveis na URL) |
| **Pode ser salvo no favoritos** | Sim — a busca fica na URL | Não — dados não ficam na URL |
| **Pode ser compartilhado** | Sim — envie a URL para alguém | Não |
| **Uso correto** | Leitura, busca, filtro | Criação, alteração, exclusão |

Busca é semanticamente uma operação de **leitura** — não altera dados. Por isso GET é a escolha correta. A URL `/adm?busca_usuario=joão` é um endereço estável que representa "a página do ADM filtrando por João" — pode ser salvo e compartilhado.

---

## SQL LIKE — busca por padrão

O operador `LIKE` no SQL busca registros que correspondam a um padrão de texto:

```sql
SELECT * FROM usuarios WHERE nome LIKE '%joão%'
```

O `%` é um **wildcard** (curinga) que representa qualquer sequência de caracteres:

| Padrão | Combina com |
|--------|------------|
| `'%joão%'` | qualquer string que contenha "joão" em qualquer posição |
| `'joão%'` | strings que comecem com "joão" |
| `'%joão'` | strings que terminem com "joão" |
| `'j%o'` | strings que comecem com "j" e terminem com "o" |

Para busca livre (o usuário pode digitar qualquer parte do nome), usamos `'%termo%'`:

```sql
-- Encontraria: "João Silva", "Maria João", "João"
SELECT * FROM usuarios WHERE nome LIKE '%joão%' ORDER BY nome
```

No código, montamos o padrão com template string:

```js
conexao.query(sql, [`%${nome}%`], callback)
// Se nome = 'joão', o ? vira '%joão%'
```

**Nota:** `LIKE` no MySQL **não diferencia maiúsculas e minúsculas** por padrão para colunas com collation padrão (`utf8mb4_general_ci`). Buscar por `'JOÃO'` encontra `'João'`.

---

## Parte 1 — Adicionando busca aos models

### Atualizando `models/usuarioModel.js`

Adicione a função `buscarUsuarioPorNome` ao arquivo:

```js
function buscarUsuarioPorNome(nome, callback) {
    const sql = `SELECT * FROM usuarios WHERE nome LIKE ? ORDER BY nome`
    conexao.query(sql, [`%${nome}%`], callback)
}
```

E exporte-a:

```js
module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuarioPorId,
    buscarUsuarioPorNome,    // ← adicione
    atualizarUsuario,
    deletarUsuario
}
```

### Atualizando `models/produtoModel.js`

Adicione a função `buscarProdutoPorNome` ao arquivo:

```js
function buscarProdutoPorNome(nome, callback) {
    const sql = `SELECT * FROM produtos WHERE nome LIKE ? ORDER BY nome`
    conexao.query(sql, [`%${nome}%`], callback)
}
```

E exporte-a:

```js
module.exports = {
    criarProduto,
    listarProdutos,
    buscarProdutoPorId,
    buscarProdutoPorNome,    // ← adicione
    atualizarProduto,
    deletarProduto
}
```

---

## Parte 2 — Funções como valores

Antes de ver o controller atualizado, precisamos entender um conceito que usaremos: **funções são valores em JavaScript**.

Assim como um número ou uma string pode ser armazenado em uma variável, uma função também pode:

```js
const somar = (a, b) => a + b
const resultado = somar(2, 3)   // 5
```

E uma função pode ser escolhida condicionalmente:

```js
const operacao = condicao ? funcaoA : funcaoB
operacao(argumento)   // chama funcaoA ou funcaoB dependendo da condição
```

No controller, usamos isso para decidir qual função do model chamar com base na busca ativa:

```js
const buscarUsuarios = buscaUsuario
    ? (cb) => usuarioModel.buscarUsuarioPorNome(buscaUsuario, cb)
    : (cb) => usuarioModel.listarUsuarios(cb)
```

**O que isso significa:**
- Se `buscaUsuario` é uma string não-vazia (truthy): `buscarUsuarios` recebe uma função que chama `buscarUsuarioPorNome` com o termo de busca
- Se `buscaUsuario` é `''` (falsy): `buscarUsuarios` recebe uma função que chama `listarUsuarios`

Em ambos os casos, `buscarUsuarios` é uma função que aceita um callback `cb`. Então chamamos da mesma forma independentemente do caso:

```js
buscarUsuarios((erro, usuarios) => {
    // funciona tanto para busca quanto para listagem total
})
```

Isso evita duplicar o callback de tratamento de resultado para os dois casos.

---

## Parte 3 — Atualizando `controllers/admController.js`

Substitua o conteúdo do arquivo:

```js
const usuarioModel = require('../models/usuarioModel')
const produtoModel = require('../models/produtoModel')

function painelAdm(req, res) {
    const buscaUsuario = req.query.busca_usuario || ''
    const buscaProduto = req.query.busca_produto || ''

    const buscarUsuarios = buscaUsuario
        ? (cb) => usuarioModel.buscarUsuarioPorNome(buscaUsuario, cb)
        : (cb) => usuarioModel.listarUsuarios(cb)

    const buscarProdutos = buscaProduto
        ? (cb) => produtoModel.buscarProdutoPorNome(buscaProduto, cb)
        : (cb) => produtoModel.listarProdutos(cb)

    buscarUsuarios((erroU, usuarios) => {
        if (erroU) {
            console.log(erroU)
            return res.send('Erro ao carregar usuários.')
        }

        buscarProdutos((erroP, produtos) => {
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
                    <td class="actions">
                        <a href="/usuarios/${u.id}/editar" class="btn btn-edit">Editar</a>
                        <form action="/usuarios/${u.id}/deletar" method="POST" style="display:inline">
                            <button type="submit" class="btn btn-delete">Excluir</button>
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
                    <td class="actions">
                        <a href="/produtos/${p.id}/editar" class="btn btn-edit">Editar</a>
                        <form action="/produtos/${p.id}/deletar" method="POST" style="display:inline">
                            <button type="submit" class="btn btn-delete">Excluir</button>
                        </form>
                    </td>
                </tr>
            `).join('')

            const semUsuarios = usuarios.length === 0
                ? `<tr><td colspan="7" class="empty-row">Nenhum usuário encontrado.</td></tr>`
                : linhasUsuarios

            const semProdutos = produtos.length === 0
                ? `<tr><td colspan="6" class="empty-row">Nenhum produto encontrado.</td></tr>`
                : linhasProdutos

            const html = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Painel ADM</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>

                    <div class="layout">

                        <nav class="sidebar">
                            <div class="sidebar-logo">MeuCRUD</div>
                            <ul class="nav-links">
                                <li><a href="/adm">Painel</a></li>
                                <li><a href="/formulario.html">Novo Usuário</a></li>
                                <li><a href="/produto.html">Novo Produto</a></li>
                            </ul>
                        </nav>

                        <main class="content">
                            <h1>Painel Administrativo</h1>

                            <div class="section-header">
                                <h2>Usuários (${usuarios.length})</h2>
                                <a href="/formulario.html" class="btn btn-primary">+ Novo usuário</a>
                            </div>

                            <form class="search-form" method="GET" action="/adm">
                                <input
                                    type="text"
                                    name="busca_usuario"
                                    value="${buscaUsuario}"
                                    placeholder="Buscar por nome...">
                                <button type="submit" class="btn btn-primary">Buscar</button>
                                ${buscaUsuario
                                    ? `<a href="/adm" class="btn btn-secondary">Limpar</a>`
                                    : ''}
                            </form>

                            <table>
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
                                    ${semUsuarios}
                                </tbody>
                            </table>

                            <hr class="divider">

                            <div class="section-header">
                                <h2>Produtos (${produtos.length})</h2>
                                <a href="/produto.html" class="btn btn-primary">+ Novo produto</a>
                            </div>

                            <form class="search-form" method="GET" action="/adm">
                                <input
                                    type="text"
                                    name="busca_produto"
                                    value="${buscaProduto}"
                                    placeholder="Buscar por nome...">
                                <button type="submit" class="btn btn-primary">Buscar</button>
                                ${buscaProduto
                                    ? `<a href="/adm" class="btn btn-secondary">Limpar</a>`
                                    : ''}
                            </form>

                            <table>
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
                                    ${semProdutos}
                                </tbody>
                            </table>

                        </main>
                    </div>

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

---

### Analisando os pontos novos

#### `req.query.busca_usuario || ''`

```js
const buscaUsuario = req.query.busca_usuario || ''
```

Quando não há query string, `req.query.busca_usuario` é `undefined`. `undefined || ''` retorna `''` (string vazia). Isso garante que `buscaUsuario` é sempre uma string — sem risco de `undefined` aparecer no `value` do input HTML.

---

#### `value="${buscaUsuario}"` no input

```html
<input type="text" name="busca_usuario" value="${buscaUsuario}" placeholder="Buscar por nome...">
```

Pré-preenche o campo de busca com o termo atual. Sem isso, após submeter a busca o campo ficaria vazio, confundindo o usuário sobre o que está sendo filtrado. Com `value="${buscaUsuario}"`:
- Sem busca ativa: `value=""` → campo vazio
- Busca ativa com "joão": `value="joão"` → campo mostra o termo

---

#### O botão "Limpar"

```js
${buscaUsuario
    ? `<a href="/adm" class="btn btn-secondary">Limpar</a>`
    : ''}
```

Um link `<a href="/adm">` que vai para o painel **sem** query string — efetivamente cancelando o filtro. Aparece apenas quando há busca ativa (`buscaUsuario` é truthy). Quando não há busca, o ternário retorna `''` e nada é renderizado.

---

#### Estado vazio — `colspan`

```js
const semUsuarios = usuarios.length === 0
    ? `<tr><td colspan="7" class="empty-row">Nenhum usuário encontrado.</td></tr>`
    : linhasUsuarios
```

Se a busca não encontrou nenhum resultado, o `tbody` ficaria vazio — uma tabela com cabeçalho e nada abaixo é visualmente confusa.

**`colspan="7"`** — o atributo `colspan` faz uma célula `<td>` ocupar N colunas. Como a tabela de usuários tem 7 colunas, `colspan="7"` faz a mensagem ocupar a largura total da tabela.

---

## Parte 4 — Adicionando estilos ao `style.css`

Adicione ao final de `public/css/style.css`:

```css
/* ── Formulário de busca ── */
.search-form {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 16px;
}

.search-form input[type="text"] {
    padding: 7px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.9rem;
    font-family: inherit;
    width: 260px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-form input[type="text"]:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
}

/* ── Estado vazio ── */
.empty-row {
    text-align: center;
    color: #9ca3af;
    font-style: italic;
    padding: 24px 16px;
}
```

### Novos conceitos CSS desta aula

**`gap: 8px`** — propriedade exclusiva de flex e grid containers. Define o espaço entre os itens filhos. É mais limpa que adicionar `margin-right` em cada item individualmente.

**`input[type="text"]`** — seletor de atributo. Afeta elementos `<input>` que tenham o atributo `type` com valor `"text"`. Mais específico que simplesmente `input {}`, que afetaria todos os inputs (checkbox, radio, submit...).

**`:focus`** — pseudo-classe que se aplica quando o elemento está com foco (cursor dentro do campo de texto, após clicar). É o estado "ativo" de um input.

**`outline: none`** — remove o contorno azul/laranja padrão que browsers adicionam ao focar um input. Removemos para substituir por um efeito mais controlado com `box-shadow`.

**`box-shadow: 0 0 0 3px rgba(...)`** no `:focus` — um shadow com deslocamento zero e desfoque zero cria um **anel ao redor do elemento**. É uma técnica comum para criar efeito de foco customizado acessível.

---

## Testando a busca

Reinicie o servidor e acesse `http://localhost:8000/adm`.

**Teste 1 — Busca básica:**
Digite parte de um nome no campo de busca de usuários e clique em Buscar. Somente usuários cujo nome contenha o termo digitado devem aparecer. A URL deve mudar para `/adm?busca_usuario=termo`.

**Teste 2 — Campo pré-preenchido:**
Após submeter a busca, o campo deve mostrar o termo que foi buscado.

**Teste 3 — Botão Limpar:**
Após uma busca, o botão "Limpar" deve aparecer. Clicando nele, volta para `/adm` sem filtro e todos os usuários reaparecem.

**Teste 4 — Busca sem resultados:**
Digite um nome que não existe. A tabela deve mostrar "Nenhum usuário encontrado." no lugar das linhas.

**Teste 5 — Busca parcial:**
Digite apenas "jo" — deve retornar todos os usuários que contenham "jo" no nome (João, Jorge, Joana, etc.).

**Teste 6 — Buscas independentes:**
Filtre por usuário. A tabela de produtos permanece mostrando todos. As duas buscas são independentes.

---

## Visualizando o fluxo de uma busca

```
Usuário digita "joão" no campo e clica em Buscar
        ↓
Browser envia GET /adm?busca_usuario=joão
(formulário GET serializa o campo name/value como query string)
        ↓
admController.painelAdm(req, res)
req.query = { busca_usuario: 'joão' }
        ↓
buscaUsuario = 'joão'
buscaProduto = ''    (sem busca de produto)
        ↓
buscarUsuarios = (cb) => usuarioModel.buscarUsuarioPorNome('joão', cb)
buscarProdutos = (cb) => produtoModel.listarProdutos(cb)
        ↓
buscarUsuarios executa:
SELECT * FROM usuarios WHERE nome LIKE '%joão%' ORDER BY nome
        ↓
banco retorna: [{ id:1, nome:'João Silva', ... }]
        ↓
buscarProdutos executa:
SELECT * FROM produtos ORDER BY nome
        ↓
banco retorna todos os produtos
        ↓
HTML montado com:
- input value="joão"     (campo pré-preenchido)
- botão "Limpar" visível (buscaUsuario é truthy)
- tabela com apenas o usuário João Silva
- tabela de produtos com todos os produtos
        ↓
res.send(html)
        ↓
Browser exibe a página filtrada
URL na barra de endereços: /adm?busca_usuario=jo%C3%A3o
```

---

## Recapitulação

### O que aprendemos

- O que é a query string: pares `chave=valor` após o `?` na URL
- `req.query` no Express: objeto que contém os parâmetros da query string automaticamente parseados
- Codificação de URL: o browser codifica caracteres especiais (`ã` → `%C3%A3`) e o Express decodifica automaticamente
- Por que usar `GET` para formulários de busca: dados ficam na URL, a URL pode ser salva e compartilhada; `POST` é para operações que alteram dados
- SQL `LIKE '%termo%'`: o `%` é wildcard que combina qualquer sequência de caracteres
- `LIKE` no MySQL não diferencia maiúsculas de minúsculas no collation padrão
- Funções como valores: armazenar uma função em variável e chamá-la indiferentemente do caso (busca ou listagem total)
- `value="${variavel}"` para pré-preencher o campo de busca com o termo ativo
- O botão "Limpar" como link para `/adm` sem query string
- `colspan="N"` para uma célula ocupar múltiplas colunas — usado na mensagem de estado vazio
- CSS `gap` para espaçamento entre itens flex sem precisar de margin em cada filho
- Seletor de atributo `input[type="text"]` — mais específico que `input`
- Pseudo-classe `:focus` para estilizar o estado de foco de inputs
- `outline: none` + `box-shadow` como técnica de foco acessível customizado

### O que fizemos no projeto

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `models/usuarioModel.js` | Adicionada `buscarUsuarioPorNome` com `LIKE` |
| `models/produtoModel.js` | Adicionada `buscarProdutoPorNome` com `LIKE` |
| `controllers/admController.js` | Lê `req.query`, escolhe função de busca ou listagem, formula de busca com campo pré-preenchido e botão Limpar, estado vazio com `colspan` |
| `public/css/style.css` | Adicionados estilos `.search-form`, `input[type="text"]`, `:focus`, `.btn-secondary`, `.empty-row` |

**Estado do painel após esta aula:**

```
Sem busca ativa:
/adm → lista todos os usuários e todos os produtos
       campo de busca vazio, sem botão Limpar

Com busca de usuário:
/adm?busca_usuario=joão → filtra usuários, lista todos os produtos
                          campo pré-preenchido com "joão", botão Limpar visível

Com busca de produto:
/adm?busca_produto=note → lista todos os usuários, filtra produtos
                          campo pré-preenchido com "note", botão Limpar visível
```

---

## Na próxima aula

Na **Aula 11** vamos estilizar as páginas públicas — a de login e os formulários de cadastro:
- Criar `public/css/forms.css` separado do `style.css` (layout centrado vs. layout com sidebar)
- CSS para a página de login: centralizar na tela com Flexbox, card branco com sombra
- Estilizar os campos `<input>` e o botão de envio do formulário
- Vincular o CSS correto a cada página
- Por que dois arquivos CSS separados em vez de um só
