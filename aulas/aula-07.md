# Aula 7 — Editar e Excluir Usuários: CRUD Completo

## Revisão da Aula 6

Na aula anterior:
- Criamos `routes/admRoutes.js` e `controllers/admController.js`
- Aprendemos renderização server-side: o servidor busca dados no banco e monta o HTML antes de enviar
- Usamos `Array.map().join()` para transformar array de objetos em linhas de tabela HTML
- O painel `GET /adm` já exibe a lista de usuários cadastrados

O CRUD de usuários está com duas operações prontas: **C**reate (criar) e **R**ead (listar). Faltam **U**pdate (editar) e **D**elete (excluir). Esta aula fecha o ciclo.

---

## O que vamos construir

Ao final desta aula, o painel ADM terá botões em cada linha da tabela:

```
| ID | Nome  | Email          | Telefone | Cidade | Estado | Ações           |
|----|-------|----------------|----------|--------|--------|-----------------|
| 1  | João  | joao@email.com | —        | —      | PR     | [Editar] [Excluir] |
| 2  | Maria | maria@email.com| —        | SP     | SP     | [Editar] [Excluir] |
```

Clicar em **Editar** abre um formulário pré-preenchido com os dados do usuário.
Clicar em **Excluir** remove o usuário do banco e atualiza a tabela.

---

## Os novos comandos SQL

### SQL UPDATE — atualizando um registro

```sql
UPDATE usuarios
SET nome = ?, email = ?, telefone = ?, genero = ?, data_nascimento = ?, cidade = ?, estado = ?, endereco = ?
WHERE id = ?
```

- **`UPDATE tabela`** — indica qual tabela será atualizada
- **`SET coluna = ?`** — define quais colunas receberão novos valores e quais serão os valores (usando `?` como placeholder)
- **`WHERE id = ?`** — filtra qual linha será atualizada

**⚠️ O `WHERE` é obrigatório no UPDATE**

Sem o `WHERE`, todos os registros da tabela seriam atualizados com os mesmos valores:

```sql
-- COM WHERE: atualiza apenas o usuário com id = 3
UPDATE usuarios SET nome = 'João' WHERE id = 3

-- SEM WHERE: atualiza o nome de TODOS os usuários para 'João'
UPDATE usuarios SET nome = 'João'
```

A posição dos valores no array também importa: os valores do `SET` vêm primeiro, e o valor do `WHERE id = ?` vem **por último**:

```js
conexao.query(sql, [
    dados.nome,       // ← SET nome = ?
    dados.email,      // ← SET email = ?
    // ... demais campos
    id                // ← WHERE id = ? (sempre o último)
], callback)
```

---

### SQL DELETE — excluindo um registro

```sql
DELETE FROM usuarios WHERE id = ?
```

- **`DELETE FROM tabela`** — indica de qual tabela excluir
- **`WHERE id = ?`** — identifica qual linha excluir

**⚠️ O `WHERE` é obrigatório no DELETE**

```sql
-- COM WHERE: exclui apenas o usuário com id = 3
DELETE FROM usuarios WHERE id = 3

-- SEM WHERE: exclui TODOS os usuários da tabela
DELETE FROM usuarios
```

---

## Parte 1 — Atualizando o Model

Abra `models/usuarioModel.js` e adicione três funções abaixo das existentes:

```js
const conexao = require('../config/database')

function criarUsuario(usuario, callback) {
    const sql = `
        INSERT INTO usuarios
        (nome, email, senha, telefone, genero, data_nascimento, cidade, estado, endereco)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    conexao.query(sql, [
        usuario.nome, usuario.email, usuario.senha, usuario.telefone,
        usuario.genero, usuario.data_nascimento, usuario.cidade,
        usuario.estado, usuario.endereco
    ], callback)
}

function listarUsuarios(callback) {
    const sql = `SELECT * FROM usuarios ORDER BY nome`
    conexao.query(sql, callback)
}

// ─── funções novas ────────────────────────────────────────────

function buscarUsuarioPorId(id, callback) {
    const sql = `SELECT * FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}

function atualizarUsuario(id, dados, callback) {
    const sql = `
        UPDATE usuarios
        SET nome = ?, email = ?, telefone = ?, genero = ?,
            data_nascimento = ?, cidade = ?, estado = ?, endereco = ?
        WHERE id = ?
    `
    conexao.query(sql, [
        dados.nome,
        dados.email,
        dados.telefone,
        dados.genero,
        dados.data_nascimento,
        dados.cidade,
        dados.estado,
        dados.endereco,
        id             // ← WHERE id = ? (sempre o último)
    ], callback)
}

function deletarUsuario(id, callback) {
    const sql = `DELETE FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}

module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuarioPorId,
    atualizarUsuario,
    deletarUsuario
}
```

### `buscarUsuarioPorId(id, callback)`

```js
function buscarUsuarioPorId(id, callback) {
    const sql = `SELECT * FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}
```

Busca um único usuário pelo `id`. O array `[id]` passa o valor que substituirá o `?`.

**Importante:** mesmo que o `SELECT WHERE id = ?` retorne apenas uma linha, o mysql2 sempre entrega o resultado como um **array**. No controller, acessaremos o usuário com `resultados[0]` — o primeiro (e único) elemento do array.

Se nenhuma linha for encontrada (ID inválido), `resultados` será um array vazio `[]`, e `resultados[0]` será `undefined`.

### `atualizarUsuario(id, dados, callback)`

```js
function atualizarUsuario(id, dados, callback) {
    const sql = `
        UPDATE usuarios
        SET nome = ?, email = ?, telefone = ?, genero = ?,
            data_nascimento = ?, cidade = ?, estado = ?, endereco = ?
        WHERE id = ?
    `
    conexao.query(sql, [
        dados.nome, dados.email, dados.telefone, dados.genero,
        dados.data_nascimento, dados.cidade, dados.estado, dados.endereco,
        id
    ], callback)
}
```

Recebe `id` (qual registro atualizar) e `dados` (os novos valores). Note que não atualizamos a `senha` — a senha permanece como estava no banco, pois não pedimos ela no formulário de edição.

### `deletarUsuario(id, callback)`

```js
function deletarUsuario(id, callback) {
    const sql = `DELETE FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}
```

A mais simples: executa o `DELETE` com o `id` recebido como parâmetro.

---

## Parte 2 — Adicionando botões no painel ADM

Abra `controllers/admController.js` e atualize o `map()` para incluir a coluna de ações, e o `<thead>` para incluir o cabeçalho:

```js
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
```

E no `<thead>` da tabela, adicione o `<th>Ações</th>`:

```html
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
```

### O link de editar

```html
<a href="/usuarios/${u.id}/editar">Editar</a>
```

Um `<a>` com `href` gera uma requisição **GET** quando clicado — não altera dados, apenas abre o formulário de edição. A URL gerada será algo como `/usuarios/3/editar`.

### O form de excluir

```html
<form action="/usuarios/${u.id}/deletar" method="POST" style="display:inline">
    <button type="submit">Excluir</button>
</form>
```

Para excluir um registro, precisamos de **POST** (pois estamos alterando dados). Formulários HTML não suportam DELETE, por isso usamos POST com uma URL descritiva (`/deletar`).

**`style="display:inline"`** — por padrão, `<form>` é um elemento de bloco (ocupa linha inteira). `display:inline` faz o form se comportar como um elemento inline, ficando na mesma linha que o link "Editar".

Cada linha da tabela terá seu próprio mini-formulário de exclusão com a URL correta para aquele usuário específico.

---

## Parte 3 — Atualizando o Controller

### Destructuring de `req.params`

Antes de ver as novas funções, vamos entender uma sintaxe nova que usaremos bastante:

```js
// Forma longa
const id = req.params.id

// Forma curta — destructuring (ES6)
const { id } = req.params
```

**Destructuring** extrai propriedades de um objeto e cria variáveis com os mesmos nomes. As duas formas produzem exatamente o mesmo resultado: uma variável `id` com o valor de `req.params.id`.

Quando precisamos de mais de uma propriedade, o destructuring é especialmente vantajoso:

```js
// Sem destructuring
const id = req.params.id
const nome = req.params.nome

// Com destructuring
const { id, nome } = req.params
```

### O operador ternário `? :`

Usaremos o operador ternário para decidir se um campo HTML deve ter o atributo `checked` ou `selected`:

```js
condição ? valorSeVerdadeiro : valorSeFalso
```

Exemplos:

```js
5 > 3 ? 'sim' : 'não'      // 'sim'
5 < 3 ? 'sim' : 'não'      // 'não'

u.genero === 'feminino' ? 'checked' : ''   // 'checked' se for feminino, '' caso contrário
u.estado === 'PR' ? 'selected' : ''        // 'selected' se for PR, '' caso contrário
```

Isso é o que usamos nos inputs do formulário de edição para marcar o valor atual do usuário.

### A função auxiliar `formatarData`

Datas vindas do MySQL chegam como objetos `Date` do JavaScript. O input HTML `type="date"` espera uma string no formato `AAAA-MM-DD`. Precisamos converter:

```js
function formatarData(valor) {
    if (!valor) return ''
    if (valor instanceof Date) return valor.toISOString().split('T')[0]
    return String(valor).split('T')[0]
}
```

**`!valor`** — se a data for `null` ou `undefined`, retorna string vazia (campo vazio no input).

**`valor instanceof Date`** — verifica se `valor` é um objeto `Date` do JavaScript. O operador `instanceof` verifica se um objeto foi criado por um determinado construtor.

**`valor.toISOString()`** — converte o objeto `Date` para string ISO: `"2000-03-15T00:00:00.000Z"`.

**`.split('T')[0]`** — divide a string pelo `T` e pega a primeira parte: `"2000-03-15"`. Esse é exatamente o formato que o `<input type="date">` espera.

---

### O arquivo completo `controllers/usuarioController.js`

Agora substituímos o arquivo com todas as funções:

```js
const usuarioModel = require('../models/usuarioModel')

const ESTADOS = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
    ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
    ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
    ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']
]

function formatarData(valor) {
    if (!valor) return ''
    if (valor instanceof Date) return valor.toISOString().split('T')[0]
    return String(valor).split('T')[0]
}

function criarUsuario(req, res) {
    usuarioModel.criarUsuario(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar usuário.')
        }
        res.redirect('/adm')
    })
}

function mostrarFormularioEdicao(req, res) {
    const { id } = req.params

    usuarioModel.buscarUsuarioPorId(id, (erro, resultados) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao buscar usuário.')
        }
        if (resultados.length === 0) {
            return res.send('Usuário não encontrado.')
        }

        const u = resultados[0]

        const opcoesEstado = ESTADOS.map(([sigla, nome]) =>
            `<option value="${sigla}" ${u.estado === sigla ? 'selected' : ''}>${nome}</option>`
        ).join('\n')

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editar Usuário</title>
            </head>
            <body>

                <h1>Editar Usuário</h1>

                <form action="/usuarios/${u.id}/editar" method="POST">

                    <label>Nome:</label>
                    <input type="text" name="nome" value="${u.nome}" required>
                    <br><br>

                    <label>Email:</label>
                    <input type="email" name="email" value="${u.email}" required>
                    <br><br>

                    <label>Telefone:</label>
                    <input type="tel" name="telefone" value="${u.telefone || ''}">
                    <br><br>

                    <label>Gênero:</label><br>
                    <input type="radio" name="genero" value="feminino" ${u.genero === 'feminino' ? 'checked' : ''}>
                    <label>Feminino</label>
                    <input type="radio" name="genero" value="masculino" ${u.genero === 'masculino' ? 'checked' : ''}>
                    <label>Masculino</label>
                    <input type="radio" name="genero" value="outro" ${u.genero === 'outro' ? 'checked' : ''}>
                    <label>Outro</label>
                    <br><br>

                    <label>Data de nascimento:</label>
                    <input type="date" name="data_nascimento" value="${formatarData(u.data_nascimento)}">
                    <br><br>

                    <label>Cidade:</label>
                    <input type="text" name="cidade" value="${u.cidade || ''}">
                    <br><br>

                    <label>Estado:</label>
                    <select name="estado">
                        <option value="">Selecione</option>
                        ${opcoesEstado}
                    </select>
                    <br><br>

                    <label>Endereço:</label>
                    <input type="text" name="endereco" value="${u.endereco || ''}">
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

function atualizarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.atualizarUsuario(id, req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao atualizar usuário.')
        }
        res.redirect('/adm')
    })
}

function deletarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.deletarUsuario(id, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao excluir usuário.')
        }
        res.redirect('/adm')
    })
}

module.exports = {
    criarUsuario,
    mostrarFormularioEdicao,
    atualizarUsuario,
    deletarUsuario
}
```

---

### Analisando `mostrarFormularioEdicao` em detalhes

```js
function mostrarFormularioEdicao(req, res) {
    const { id } = req.params
    ...
}
```

`req.params.id` contém o valor capturado do `:id` na URL. Se a URL foi `/usuarios/3/editar`, então `id === '3'` (string).

---

```js
usuarioModel.buscarUsuarioPorId(id, (erro, resultados) => {
    if (erro) { ... }
    if (resultados.length === 0) {
        return res.send('Usuário não encontrado.')
    }

    const u = resultados[0]
    ...
})
```

`resultados` é sempre um array. Verificamos:
1. Se houve erro no banco
2. Se o array está vazio (ID não existe)
3. Se passou pelos dois, `resultados[0]` é o objeto do usuário

`const u = resultados[0]` — atalho para não escrever `resultados[0].nome`, `resultados[0].email`, etc. toda hora.

---

```js
const opcoesEstado = ESTADOS.map(([sigla, nome]) =>
    `<option value="${sigla}" ${u.estado === sigla ? 'selected' : ''}>${nome}</option>`
).join('\n')
```

`ESTADOS` é um array de arrays: `[['AC', 'Acre'], ['SP', 'São Paulo'], ...]`.

No `.map()`, usamos destructuring diretamente no parâmetro: `([sigla, nome])` extrai o primeiro e segundo elemento de cada sub-array.

Para cada estado, geramos um `<option>`. Se `u.estado === sigla` (ou seja, o estado do usuário é o estado atual do loop), adicionamos `selected` ao option — isso pré-seleciona o estado correto no `<select>`.

---

```html
<input type="radio" name="genero" value="feminino" ${u.genero === 'feminino' ? 'checked' : ''}>
```

O atributo `checked` em um radio button faz ele aparecer marcado na página. O ternário verifica se o gênero do usuário é `'feminino'`: se sim, insere `'checked'`; se não, insere `''` (string vazia, que o HTML ignora).

---

```html
<input type="text" name="telefone" value="${u.telefone || ''}">
```

Para campos opcionais que podem ser `null`, usamos `|| ''` em vez de `|| '—'`. Isso garante que o campo aparece vazio no input (em vez de aparecer o texto literal `—` para o usuário editar).

---

### Analisando `atualizarUsuario`

```js
function atualizarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.atualizarUsuario(id, req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao atualizar usuário.')
        }
        res.redirect('/adm')
    })
}
```

Passa dois valores para o model:
- `id` — de `req.params` (qual usuário atualizar)
- `req.body` — os novos dados do formulário

O model usa `id` no `WHERE` e `req.body` no `SET`.

---

### Analisando `deletarUsuario`

```js
function deletarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.deletarUsuario(id, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao excluir usuário.')
        }
        res.redirect('/adm')
    })
}
```

Apenas o `id` é necessário — não há `req.body` pois o formulário de exclusão não tem campos, só um botão.

---

## Parte 4 — Atualizando as Rotas

Abra `routes/usuariosRoutes.js` e adicione as três novas rotas:

```js
const express = require('express')
const router = express.Router()

const usuarioController = require('../controllers/usuarioController')

router.post('/', usuarioController.criarUsuario)
router.get('/:id/editar', usuarioController.mostrarFormularioEdicao)    // ← novo
router.post('/:id/editar', usuarioController.atualizarUsuario)          // ← novo
router.post('/:id/deletar', usuarioController.deletarUsuario)           // ← novo

module.exports = router
```

**`GET /:id/editar`** — exibe o formulário pré-preenchido. É GET pois apenas mostra dados (não altera).

**`POST /:id/editar`** — salva as alterações. É POST pois o formulário de edição envia dados.

**`POST /:id/deletar`** — exclui o usuário. É POST pois altera o banco (e HTML forms não suportam DELETE).

O `:id` captura qualquer valor nessa posição da URL e o disponibiliza em `req.params.id`.

---

## Testando o sistema

Reinicie o servidor:

```bash
node index.js
```

### Teste 1 — Ver botões no painel
Acesse `http://localhost:8000/adm`. Cada linha deve ter os botões "Editar" e "Excluir".

### Teste 2 — Editar
Clique em "Editar" de qualquer usuário. O formulário deve abrir com todos os campos preenchidos com os dados atuais. Altere algum campo e clique em "Salvar alterações". O painel deve reabrir com os dados atualizados.

### Teste 3 — Excluir
Clique em "Excluir" de qualquer usuário. O usuário deve desaparecer da tabela imediatamente.

### Teste 4 — Verificar no banco
Após editar ou excluir, confirme no MySQL Workbench:
```sql
SELECT * FROM usuarios;
```

---

## Visualizando os fluxos

### Fluxo de Editar (GET → formulário → POST → redirect)

```
Usuário clica em "Editar" do usuário id=3
        ↓
Browser faz GET /usuarios/3/editar
        ↓
router.get('/:id/editar', ...) → id = '3'
        ↓
mostrarFormularioEdicao(req, res)
        ↓
buscarUsuarioPorId('3', callback)
        ↓
SELECT * FROM usuarios WHERE id = 3
        ↓
MySQL retorna: [{ id:3, nome:'João', email:'joao@...', ... }]
        ↓
resultados[0] = { id:3, nome:'João', ... }
        ↓
Controller monta HTML com value="${u.nome}", checked, selected
        ↓
res.send(html) — formulário pré-preenchido aparece no browser

────────── usuário altera campos e clica em "Salvar" ──────────

Browser faz POST /usuarios/3/editar com novos dados no body
        ↓
router.post('/:id/editar', ...) → id = '3'
        ↓
atualizarUsuario(req, res) → id='3', req.body={nome:'João Silva', ...}
        ↓
usuarioModel.atualizarUsuario('3', req.body, callback)
        ↓
UPDATE usuarios SET nome=?, email=? ... WHERE id=3
        ↓
MySQL confirma → callback(null, { changedRows: 1 })
        ↓
res.redirect('/adm') → browser abre o painel com dados atualizados
```

### Fluxo de Excluir

```
Usuário clica no botão "Excluir" do usuário id=2
        ↓
Browser envia POST /usuarios/2/deletar (sem body)
        ↓
router.post('/:id/deletar', ...) → id = '2'
        ↓
deletarUsuario(req, res) → id = '2'
        ↓
usuarioModel.deletarUsuario('2', callback)
        ↓
DELETE FROM usuarios WHERE id = 2
        ↓
MySQL confirma → callback(null, { affectedRows: 1 })
        ↓
res.redirect('/adm') → browser abre o painel sem o usuário excluído
```

---

## Tabela de rotas de usuários — estado final

| Método | URL | O que faz |
|--------|-----|-----------|
| `POST` | `/usuarios` | Cria um novo usuário |
| `GET` | `/usuarios/:id/editar` | Exibe formulário pré-preenchido |
| `POST` | `/usuarios/:id/editar` | Salva as alterações |
| `POST` | `/usuarios/:id/deletar` | Exclui o usuário |

---

## Recapitulação

### O que aprendemos

- O SQL `UPDATE ... SET ... WHERE id = ?` — por que o `WHERE` é obrigatório e por que o `id` vai sempre por último no array de valores
- O SQL `DELETE FROM ... WHERE id = ?` — o mesmo princípio do `WHERE`
- `buscarUsuarioPorId` e por que o mysql2 sempre retorna um array no `SELECT`, mesmo com apenas uma linha — acessamos com `resultados[0]`
- O operador ternário `condição ? valorA : valorB` e como ele gera os atributos `checked` e `selected` no HTML
- Como pré-preencher cada tipo de campo HTML com dados do banco:
  - Input de texto: `value="${u.campo}"`
  - Input de data: `value="${formatarData(u.data_nascimento)}"` com conversão de objeto `Date`
  - Radio button: `${u.genero === 'valor' ? 'checked' : ''}`
  - Select/Option: `${u.estado === 'sigla' ? 'selected' : ''}`
- `instanceof` para verificar o tipo de um objeto em JavaScript
- Destructuring de parâmetros em `.map(([sigla, nome]) => ...)` para arrays de arrays
- Por que usamos `POST` para deletar em vez de `DELETE` — HTML forms só suportam GET e POST
- `style="display:inline"` para colocar o form de exclusão na mesma linha que o link de edição
- Destructuring de `req.params`: `const { id } = req.params`

### O que fizemos no projeto

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `models/usuarioModel.js` | Adicionadas `buscarUsuarioPorId`, `atualizarUsuario`, `deletarUsuario` |
| `controllers/usuarioController.js` | Adicionadas `mostrarFormularioEdicao`, `atualizarUsuario`, `deletarUsuario`; adicionada `formatarData` e array `ESTADOS` |
| `routes/usuariosRoutes.js` | Adicionadas rotas `GET /:id/editar`, `POST /:id/editar`, `POST /:id/deletar` |
| `controllers/admController.js` | Adicionada coluna "Ações" com link Editar e form Excluir em cada linha |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET /adm                    → painel com botões Editar e Excluir    ✓
→ POST /usuarios              → cria usuário → redirect /adm          ✓
→ GET /usuarios/:id/editar    → formulário pré-preenchido             ✓  ← novo
→ POST /usuarios/:id/editar   → atualiza no banco → redirect /adm     ✓  ← novo
→ POST /usuarios/:id/deletar  → exclui do banco → redirect /adm       ✓  ← novo
```

**CRUD de usuários: completo ✓**

```
Create  →  POST /usuarios              ✓
Read    →  GET  /adm                   ✓
Update  →  GET + POST /usuarios/:id/editar  ✓
Delete  →  POST /usuarios/:id/deletar  ✓
```

---

## Na próxima aula

Na **Aula 8** vamos aplicar exatamente o mesmo padrão para criar o CRUD completo de produtos:
- Criar `models/produtoModel.js` com todas as funções SQL
- Criar `controllers/produtoController.js`
- Criar `routes/produtosRoutes.js`
- Criar `public/produto.html` com o formulário de cadastro
- Adicionar a tabela de produtos no painel ADM
- Registrar as rotas no `index.js`
