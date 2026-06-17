# Aula 4 — A Camada Model: Criar e Listar Usuários

## Revisão da Aula 3

Na aula anterior:
- Criamos o banco de dados `meuCrud` no MySQL
- Criamos as tabelas `usuarios` e `produtos` com todos os campos e tipos de dados
- Criamos `config/database.js`, que configura e estabelece a conexão com o MySQL
- Aprendemos o padrão error-first callback do Node.js
- Entendemos `module.exports` e `require` entre arquivos do projeto
- O servidor agora conecta ao banco ao iniciar

O formulário ainda não salva dados no banco. Para isso, precisamos criar a **camada Model**.

---

## O que é a camada Model

No padrão MVC, a camada **Model** é a única parte do sistema que sabe como se comunicar com o banco de dados. Ela contém todas as funções que executam SQL.

Por que separar o SQL em uma camada própria em vez de escrever diretamente no controller?

**Sem Model (SQL no controller — forma errada):**
```js
// controller faz tudo: recebe requisição, executa SQL, envia resposta
function criarUsuario(req, res) {
    const sql = 'INSERT INTO usuarios (nome) VALUES (?)'
    conexao.query(sql, [req.body.nome], (erro) => {
        res.redirect('/')
    })
}
```

**Com Model (SQL separado — forma correta):**
```js
// model: só sabe fazer SQL
function criarUsuario(usuario, callback) {
    const sql = 'INSERT INTO usuarios (nome) VALUES (?)'
    conexao.query(sql, [usuario.nome], callback)
}

// controller: só sabe receber requisição e chamar o model
function criarUsuario(req, res) {
    usuarioModel.criarUsuario(req.body, (erro) => {
        res.redirect('/')
    })
}
```

A separação traz três vantagens práticas:

1. **Organização** — se a tabela mudar de nome ou a query precisar de ajuste, você muda apenas no model, sem tocar no controller
2. **Reutilização** — o mesmo model pode ser chamado por múltiplos controllers
3. **Legibilidade** — o controller fica focado em lógica de fluxo, não em SQL

---

## Criando `models/usuarioModel.js`

Crie o arquivo `models/usuarioModel.js` com o seguinte conteúdo:

```js
const conexao = require('../config/database')

function criarUsuario(usuario, callback) {
    const sql = `
        INSERT INTO usuarios
        (nome, email, senha, telefone, genero, data_nascimento, cidade, estado, endereco)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    conexao.query(
        sql,
        [
            usuario.nome,
            usuario.email,
            usuario.senha,
            usuario.telefone,
            usuario.genero,
            usuario.data_nascimento,
            usuario.cidade,
            usuario.estado,
            usuario.endereco
        ],
        callback
    )
}

function listarUsuarios(callback) {
    const sql = `SELECT * FROM usuarios ORDER BY nome`
    conexao.query(sql, callback)
}

module.exports = {
    criarUsuario,
    listarUsuarios
}
```

Agora vamos analisar cada parte em profundidade.

---

## Linha 1 — Importando a conexão

```js
const conexao = require('../config/database')
```

Importamos o objeto de conexão exportado por `config/database.js`.

**`'../config/database'`** — o `../` sobe um nível na árvore de pastas. Como este arquivo está em `models/`, precisamos subir para a raiz (`meuCRUD/`) e então entrar em `config/`. O Node.js adiciona `.js` automaticamente.

```
models/usuarioModel.js    ← estamos aqui
      ../                 ← sobe para meuCRUD/
         config/          ← entra em config/
                database  ← lê database.js
```

`conexao` agora é o objeto de conexão com o banco, pronto para executar queries.

---

## A função `criarUsuario`

```js
function criarUsuario(usuario, callback) {
    ...
}
```

A função recebe dois parâmetros:

| Parâmetro | Tipo | O que contém |
|-----------|------|-------------|
| `usuario` | objeto | Os dados do formulário: `{ nome, email, senha, ... }` |
| `callback` | função | A função a ser chamada quando a query terminar |

### Por que a função recebe um callback?

Porque `conexao.query()` é **assíncrona** — ela não termina imediatamente. O Node.js precisa enviar o SQL pela rede até o MySQL, esperar o MySQL processar e receber a resposta. Tudo isso leva tempo.

Em JavaScript, não podemos simplesmente fazer:

```js
// ERRADO — query é assíncrona, não retorna um valor diretamente
const resultado = conexao.query(sql, valores)
```

A solução do Node.js é o callback: você passa uma função que será chamada **quando a operação terminar**, recebendo o resultado como argumento.

### A analogia do callback

Imagine que você liga para uma pizzaria e pede uma pizza. Você não fica em silêncio esperando a pizza aparecer pelo telefone — você diz **"quando estiver pronta, me ligue"** e desliga. Quando a pizza fica pronta, a pizzaria te liga.

Em código:
- **Você** é o controller que chama `criarUsuario`
- **A pizzaria** é `conexao.query` executando o SQL no banco
- **"Me ligue quando estiver pronta"** é o callback
- **A ligação da pizzaria** é o Node.js chamando o callback com `(erro, resultado)`

### Propagando o callback

Repare que o `callback` recebido como parâmetro é passado **diretamente** para `conexao.query`:

```js
function criarUsuario(usuario, callback) {
    conexao.query(sql, valores, callback)
    //                          ↑
    //               o mesmo callback que recebemos
}
```

Isso funciona porque `conexao.query` vai chamar esse callback quando terminar, passando `(erro, resultado)`. Estamos apenas repassando a responsabilidade de lidar com o resultado para quem chamou a função — o controller.

O fluxo é:

```
controller chama criarUsuario(req.body, minhaFuncao)
        ↓
criarUsuario chama conexao.query(sql, valores, minhaFuncao)
        ↓
MySQL executa o INSERT
        ↓
mysql2 chama minhaFuncao(erro, resultado)
        ↓
o controller lida com o erro ou redireciona o usuário
```

---

## O SQL INSERT INTO

```js
const sql = `
    INSERT INTO usuarios
    (nome, email, senha, telefone, genero, data_nascimento, cidade, estado, endereco)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`
```

**`INSERT INTO usuarios`** — insere um registro na tabela `usuarios`.

**`(nome, email, senha, ...)`** — lista das colunas que receberão valores. Não incluímos `id` porque ele é `AUTO_INCREMENT` — o banco gera sozinho.

**`VALUES (?, ?, ?, ...)`** — os `?` são **marcadores de posição** (placeholders). Eles serão substituídos pelos valores reais na ordem em que aparecem no array do segundo argumento de `query()`.

### Por que usar `?` em vez de concatenar strings?

A alternativa ingênua seria concatenar a string:

```js
// NUNCA FAÇA ISSO — vulnerável a SQL Injection
const sql = `INSERT INTO usuarios (nome) VALUES ('${usuario.nome}')`
```

Se o usuário preencher o campo nome com `João'); DROP TABLE usuarios; --`, o SQL executado seria:

```sql
INSERT INTO usuarios (nome) VALUES ('João'); DROP TABLE usuarios; --')
```

Isso **apagaria toda a tabela `usuarios`**. Esse ataque se chama **SQL Injection**.

Com `?`, o mysql2 trata os valores como dados literais, não como parte do SQL — o ataque não funciona:

```js
// SEGURO — o mysql2 escapa os valores automaticamente
conexao.query(sql, [usuario.nome], callback)
```

---

## O array de valores

```js
conexao.query(
    sql,
    [
        usuario.nome,
        usuario.email,
        usuario.senha,
        usuario.telefone,
        usuario.genero,
        usuario.data_nascimento,
        usuario.cidade,
        usuario.estado,
        usuario.endereco
    ],
    callback
)
```

**`conexao.query()`** recebe três argumentos:

1. **`sql`** — a string SQL com os `?`
2. **Array de valores** — cada elemento substituirá um `?` **na mesma ordem**. O primeiro `?` recebe `usuario.nome`, o segundo recebe `usuario.email`, e assim por diante
3. **`callback`** — a função a ser chamada quando a query terminar

**A ordem importa:** se você trocar a posição de `usuario.email` e `usuario.senha` no array, os valores serão gravados nas colunas erradas.

---

## O que o callback recebe após um INSERT

Quando um `INSERT` é executado com sucesso, o mysql2 chama o callback com:

```js
(erro, resultado) => {
    // erro = null (não houve erro)
    // resultado = objeto com informações da operação
}
```

O objeto `resultado` após um INSERT contém, entre outros:

```js
{
    affectedRows: 1,   // quantas linhas foram inseridas (geralmente 1)
    insertId: 5,       // o ID gerado pelo AUTO_INCREMENT para o novo registro
    changedRows: 0
}
```

- **`resultado.affectedRows`** — confirma que uma linha foi inserida
- **`resultado.insertId`** — o `id` gerado para o novo registro. Útil se você quiser redirecionar para a página do usuário recém-criado

No nosso model, repassamos o callback diretamente, então quem recebe esses valores é o controller. Na Aula 5, veremos como o controller usa isso.

---

## A função `listarUsuarios`

```js
function listarUsuarios(callback) {
    const sql = `SELECT * FROM usuarios ORDER BY nome`
    conexao.query(sql, callback)
}
```

Esta função é mais simples: não recebe dados para inserir, apenas executa uma busca.

### O SQL SELECT

```sql
SELECT * FROM usuarios ORDER BY nome
```

- **`SELECT *`** — seleciona **todas** as colunas da tabela. O `*` é um atalho para "todos os campos"
- **`FROM usuarios`** — da tabela `usuarios`
- **`ORDER BY nome`** — ordena os resultados pelo campo `nome` em ordem alfabética crescente (A → Z). Sem `ORDER BY`, a ordem dos resultados não é garantida

### `conexao.query(sql, callback)` sem array de valores

Repare que aqui chamamos `query` com apenas **dois argumentos** (sem o array de valores), porque o SQL não tem `?` — não há dados variáveis nesta query:

```js
// SELECT sem parâmetros: apenas sql e callback
conexao.query(sql, callback)

// INSERT com parâmetros: sql, array de valores e callback
conexao.query(sql, [valores], callback)
```

### O que o callback recebe após um SELECT

Após um `SELECT`, o mysql2 chama o callback com um **array de objetos**, onde cada objeto representa uma linha da tabela:

```js
(erro, resultados) => {
    // resultados = [
    //   { id: 1, nome: 'Ana', email: 'ana@email.com', cidade: 'SP', ... },
    //   { id: 2, nome: 'João', email: 'joao@email.com', cidade: 'PR', ... },
    //   { id: 3, nome: 'Maria', email: 'maria@email.com', cidade: 'RJ', ... }
    // ]
}
```

- Cada **chave** do objeto é o nome de uma **coluna** da tabela
- Cada **valor** é o dado armazenado naquela coluna para aquela linha
- Se não houver registros na tabela, `resultados` será um array vazio `[]`

Para acessar os dados:
```js
resultados[0]        // primeiro usuário (objeto)
resultados[0].nome   // nome do primeiro usuário
resultados.length    // quantidade total de usuários
```

---

## `module.exports` com objeto

```js
module.exports = {
    criarUsuario,
    listarUsuarios
}
```

Exportamos um **objeto** com as duas funções. Isso é diferente da Aula 3, onde exportamos diretamente a conexão:

```js
// database.js — exporta um valor direto
module.exports = conexao

// usuarioModel.js — exporta um objeto com múltiplas funções
module.exports = {
    criarUsuario,
    listarUsuarios
}
```

**`{ criarUsuario, listarUsuarios }`** é uma abreviação do JavaScript moderno (ES6). É equivalente a:

```js
module.exports = {
    criarUsuario: criarUsuario,
    listarUsuarios: listarUsuarios
}
```

Quando a chave e a variável têm o mesmo nome, você pode escrever apenas uma vez.

Quando outro arquivo importar este model:

```js
const usuarioModel = require('./models/usuarioModel')
```

`usuarioModel` será esse objeto, e as funções ficarão acessíveis como:

```js
usuarioModel.criarUsuario(...)
usuarioModel.listarUsuarios(...)
```

---

## Passo a passo — testando o model

Para verificar que o model está funcionando, vamos adicionar uma rota de teste temporária no `index.js`. Ela será removida na Aula 5.

Abra o `index.js` e atualize:

```js
const express = require('express')
const path = require('path')

require('./config/database')

const usuarioModel = require('./models/usuarioModel')  // ← adicione

const app = express()
const port = 8000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.post('/usuarios', (req, res) => {
    console.log('Dados recebidos:', req.body)
    res.redirect('/')
})

// Rota de teste — será removida na Aula 5
app.get('/teste-listar', (req, res) => {
    usuarioModel.listarUsuarios((erro, usuarios) => {
        if (erro) {
            return res.send('Erro: ' + erro.message)
        }
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

### O que a rota de teste faz

```js
app.get('/teste-listar', (req, res) => {
    usuarioModel.listarUsuarios((erro, usuarios) => {
        if (erro) {
            return res.send('Erro: ' + erro.message)
        }
        res.json(usuarios)
    })
})
```

Quando alguém acessa `GET /teste-listar`:

1. O controller chama `usuarioModel.listarUsuarios()` passando um callback
2. O model executa `SELECT * FROM usuarios`
3. Quando o MySQL responde, o callback é chamado com `(erro, usuarios)`
4. Se houver erro, enviamos a mensagem de erro
5. Se tiver sucesso, enviamos o array de usuários como JSON com `res.json(usuarios)`

### Testando

Reinicie o servidor e acesse `http://localhost:8000/teste-listar` no browser.

Se o banco estiver vazio, você verá:
```json
[]
```

Se você inseriu registros de teste com `INSERT` no MySQL Workbench na Aula 3, verá algo como:
```json
[
    {
        "id": 1,
        "nome": "João Silva",
        "email": "joao@email.com",
        "senha": "123456",
        "telefone": null,
        "genero": null,
        "data_nascimento": null,
        "cidade": "Curitiba",
        "estado": "PR",
        "endereco": null
    }
]
```

Os campos que não foram preenchidos aparecem como `null` — o mesmo valor `NULL` do banco convertido para JavaScript.

---

## Visualizando o fluxo de dados

```
Browser acessa GET /teste-listar
        ↓
index.js — app.get('/teste-listar', callback)
        ↓
callback chama usuarioModel.listarUsuarios(meuCallback)
        ↓
listarUsuarios chama conexao.query('SELECT * FROM usuarios', meuCallback)
        ↓
mysql2 envia o SQL pelo protocolo TCP até o MySQL Server
        ↓
MySQL executa: SELECT * FROM usuarios ORDER BY nome
        ↓
MySQL retorna as linhas encontradas
        ↓
mysql2 converte as linhas em objetos JavaScript
        ↓
mysql2 chama meuCallback(null, [{ id:1, nome:'João', ... }, ...])
        ↓
meuCallback recebe erro = null, usuarios = [...]
        ↓
res.json(usuarios) — envia o array como JSON para o browser
        ↓
Browser exibe o JSON na tela
```

---

## Comparando: SELECT vs INSERT no callback

| Operação | 2º argumento de `query` | O que `resultados` contém |
|----------|------------------------|--------------------------|
| `SELECT` | callback diretamente | Array de objetos (as linhas) |
| `INSERT` | array de valores, depois callback | Objeto com `insertId` e `affectedRows` |
| `UPDATE` | array de valores, depois callback | Objeto com `changedRows` e `affectedRows` |
| `DELETE` | array de valores, depois callback | Objeto com `affectedRows` |

---

## Recapitulação

### O que aprendemos

- O papel da camada Model no MVC: concentrar todo o SQL em um único lugar
- Por que separar SQL do controller traz organização, reutilização e legibilidade
- O conceito de **callback propagado**: uma função que recebe um callback e o repassa para uma operação assíncrona
- Por que não podemos retornar valores diretamente de operações assíncronas
- O SQL `INSERT INTO tabela (colunas) VALUES (?, ?, ?)` e como os `?` protegem contra SQL Injection
- O SQL `SELECT * FROM tabela ORDER BY coluna` e o papel do `ORDER BY`
- Por que `conexao.query()` recebe dois ou três argumentos dependendo do SQL
- O que o mysql2 entrega no callback após um `INSERT`: objeto com `insertId` e `affectedRows`
- O que o mysql2 entrega no callback após um `SELECT`: array de objetos com os dados das linhas
- Como exportar múltiplas funções com `module.exports = { funcao1, funcao2 }`
- A abreviação `{ criarUsuario }` equivale a `{ criarUsuario: criarUsuario }` em JavaScript moderno

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `models/usuarioModel.js` | Funções `criarUsuario` e `listarUsuarios` que executam SQL no banco |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `index.js` | Importado `usuarioModel` e adicionada rota `GET /teste-listar` para testar o model |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET /               → public/index.html             ✓
→ GET /formulario.html → servido como estático         ✓
→ GET /teste-listar   → lista usuários do banco em JSON ✓
→ POST /usuarios      → console.log + redirect         ✗ (ainda não salva no banco)
```

**O que ainda não funciona:** o formulário envia dados ao servidor, o servidor recebe em `req.body`, mas ainda não chama o model para salvar no banco. Isso será feito na Aula 5, quando criarmos o controller de usuários.

---

## Na próxima aula

Na **Aula 5** vamos criar a camada Controller e conectar tudo:
- Criar `controllers/usuarioController.js`
- Implementar a função `criarUsuario` que chama o model e redireciona
- Criar `routes/usuariosRoutes.js` que mapeia as URLs para as funções do controller
- Registrar as rotas no `index.js` substituindo as rotas temporárias
- Submeter o formulário e ver o usuário aparecer no banco de dados
