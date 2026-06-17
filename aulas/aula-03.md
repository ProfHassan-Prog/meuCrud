# Aula 3 — Banco de Dados MySQL e Conexão com Node.js

## Revisão da Aula 2

Na aula anterior:
- Aprendemos o protocolo HTTP e os métodos GET e POST
- Criamos múltiplas rotas no Express e entendemos como ele decide qual executar
- Criamos `formulario.html` com um `<form>` que envia dados para `POST /usuarios`
- O servidor recebe os dados em `req.body` e os exibe no terminal com `console.log`

O problema: os dados chegam ao servidor, mas são perdidos quando o servidor é reiniciado, porque variáveis JavaScript vivem apenas enquanto o programa está rodando. Precisamos de um banco de dados para salvar os dados de forma permanente.

---

## Por que precisamos de um banco de dados

Imagine que você cadastra 100 usuários e o servidor trava. Sem banco de dados, todos os 100 usuários são perdidos. Com banco de dados, os dados ficam gravados em disco e continuam lá mesmo que o servidor reinicie, o computador desligue ou o programa seja atualizado.

O banco de dados é responsável por **persistir** os dados — ou seja, mantê-los salvos de forma duradoura.

---

## O que é um banco de dados relacional

Um banco de dados relacional organiza os dados em **tabelas**. Cada tabela é como uma planilha do Excel:

- As **colunas** definem os campos (nome, email, telefone, etc.)
- As **linhas** são os registros (cada usuário cadastrado é uma linha)

Exemplo de como ficaria a tabela `usuarios`:

| id | nome        | email              | cidade     | estado |
|----|-------------|--------------------|-----------  |--------|
| 1  | João Silva  | joao@email.com     | Curitiba   | PR     |
| 2  | Maria Souza | maria@email.com    | São Paulo  | SP     |
| 3  | Pedro Lima  | pedro@email.com    | Recife     | PE     |

Um banco de dados pode ter várias tabelas. No nosso projeto teremos duas: `usuarios` e `produtos`.

### Chave primária (PRIMARY KEY)

Toda tabela precisa de uma coluna que identifique cada linha de forma **única**. Essa coluna se chama **chave primária** (primary key). No nosso projeto, a coluna `id` é a chave primária.

O banco de dados garante que nunca existirão dois registros com o mesmo `id`.

### AUTO_INCREMENT

O `AUTO_INCREMENT` faz o banco de dados atribuir automaticamente o próximo número disponível ao `id` sempre que um novo registro é inserido. Você não precisa calcular qual é o próximo `id` — o banco cuida disso.

---

## SQL — A linguagem do banco de dados

Para se comunicar com o MySQL, usamos a linguagem **SQL** (Structured Query Language — Linguagem de Consulta Estruturada). SQL é a linguagem padrão para bancos de dados relacionais.

Os comandos SQL se dividem em dois grupos:

**DDL — Data Definition Language (definição da estrutura):**

| Comando | O que faz |
|---------|-----------|
| `CREATE DATABASE` | Cria um banco de dados |
| `CREATE TABLE` | Cria uma tabela |
| `ALTER TABLE` | Modifica a estrutura de uma tabela |
| `DROP TABLE` | Remove uma tabela |

**DML — Data Manipulation Language (manipulação dos dados):**

| Comando | O que faz | Equivalente CRUD |
|---------|-----------|------------------|
| `INSERT INTO` | Insere um novo registro | Create |
| `SELECT` | Busca registros | Read |
| `UPDATE` | Atualiza registros | Update |
| `DELETE` | Remove registros | Delete |

---

## Tipos de dados no MySQL

Cada coluna de uma tabela tem um **tipo de dado** que define que tipo de valor ela pode armazenar. Os principais:

| Tipo | O que armazena | Exemplo de uso |
|------|----------------|----------------|
| `INT` | Número inteiro | `id`, `quantidade` |
| `VARCHAR(n)` | Texto de até `n` caracteres | `nome`, `email`, `cidade` |
| `CHAR(n)` | Texto de exatamente `n` caracteres | `estado` (sempre 2 letras: SP, PR) |
| `TEXT` | Texto longo sem limite definido | Descrições, conteúdo |
| `DECIMAL(x, y)` | Número decimal com `x` dígitos no total e `y` casas decimais | `preco` (ex: 49.90) |
| `DATE` | Data no formato AAAA-MM-DD | `data_nascimento` |
| `ENUM(...)` | Um valor de uma lista pré-definida | `genero` ('feminino', 'masculino', 'outro') |

### NULL e NOT NULL

- **`NULL`** significa "sem valor" / "campo vazio". Por padrão, qualquer coluna aceita `NULL`.
- **`NOT NULL`** impede que o campo fique vazio — se tentar inserir um registro sem esse campo, o banco retorna erro.

### UNIQUE

A restrição `UNIQUE` garante que dois registros não possam ter o mesmo valor nessa coluna. Usamos em `email` para impedir cadastros duplicados.

### DEFAULT

Define um valor padrão para a coluna quando nenhum valor for informado na inserção:
```sql
quantidade INT NOT NULL DEFAULT 0
```
Se o usuário cadastrar um produto sem informar a quantidade, o banco usa `0` automaticamente.

---

## Passo 1 — Criando o banco de dados no MySQL Workbench

Abra o **MySQL Workbench**, conecte-se ao servidor local e execute os seguintes comandos na aba de queries (SQL):

```sql
CREATE DATABASE meuCrud;
```

**`CREATE DATABASE`** cria um novo banco de dados.
**`meuCrud`** é o nome que demos ao banco — é o mesmo nome usado no `config/database.js`.

Após criar, precisamos dizer ao MySQL que queremos usar esse banco:

```sql
USE meuCrud;
```

**`USE`** seleciona o banco de dados ativo. Todos os comandos executados a partir daqui serão aplicados no banco `meuCrud`.

---

## Passo 2 — Criando a tabela de usuários

Execute o SQL a seguir para criar a tabela `usuarios`:

```sql
CREATE TABLE usuarios (
    id               INT           AUTO_INCREMENT PRIMARY KEY,
    nome             VARCHAR(100)  NOT NULL,
    email            VARCHAR(100)  NOT NULL UNIQUE,
    senha            VARCHAR(255)  NOT NULL,
    telefone         VARCHAR(20),
    genero           ENUM('feminino', 'masculino', 'outro'),
    data_nascimento  DATE,
    cidade           VARCHAR(100),
    estado           CHAR(2),
    endereco         VARCHAR(255)
);
```

Vamos analisar cada coluna:

---

### `id INT AUTO_INCREMENT PRIMARY KEY`

```sql
id INT AUTO_INCREMENT PRIMARY KEY
```

- **`id`** — nome da coluna
- **`INT`** — tipo inteiro (1, 2, 3, ...)
- **`AUTO_INCREMENT`** — o banco incrementa automaticamente: o primeiro registro recebe `id = 1`, o segundo `id = 2`, e assim por diante
- **`PRIMARY KEY`** — declara esta coluna como chave primária: valores únicos, nunca `NULL`

---

### `nome VARCHAR(100) NOT NULL`

```sql
nome VARCHAR(100) NOT NULL
```

- **`VARCHAR(100)`** — texto de até 100 caracteres. O banco armazena apenas os caracteres usados (eficiente)
- **`NOT NULL`** — obrigatório: não pode cadastrar um usuário sem nome

---

### `email VARCHAR(100) NOT NULL UNIQUE`

```sql
email VARCHAR(100) NOT NULL UNIQUE
```

- **`NOT NULL`** — obrigatório
- **`UNIQUE`** — o banco rejeita um novo registro se já existir outro com o mesmo email

---

### `senha VARCHAR(255) NOT NULL`

```sql
senha VARCHAR(255) NOT NULL
```

- **`VARCHAR(255)`** — 255 caracteres é o tamanho padrão para senhas. Quando você adicionar criptografia (hash) futuramente, o resultado será uma string longa — 255 caracteres comporta isso
- **`NOT NULL`** — obrigatório

---

### `telefone VARCHAR(20)`

```sql
telefone VARCHAR(20)
```

- **`VARCHAR(20)`** — comporta formatos como `(45) 99999-9999` (15 caracteres) com folga
- Sem `NOT NULL` → o campo é opcional (aceita `NULL`)

---

### `genero ENUM('feminino', 'masculino', 'outro')`

```sql
genero ENUM('feminino', 'masculino', 'outro')
```

- **`ENUM`** — restringe os valores possíveis à lista fornecida. Qualquer outro valor é rejeitado pelo banco
- Sem `NOT NULL` → opcional

---

### `data_nascimento DATE`

```sql
data_nascimento DATE
```

- **`DATE`** — armazena datas no formato `AAAA-MM-DD` (ex: `2000-03-15`)
- O `<input type="date">` no HTML já envia nesse formato

---

### `estado CHAR(2)`

```sql
estado CHAR(2)
```

- **`CHAR(2)`** — texto de exatamente 2 caracteres. Diferente de `VARCHAR`, o `CHAR` sempre reserva o espaço fixo. Ideal para códigos de tamanho fixo como siglas de estado (SP, PR, RJ)

---

## Passo 3 — Criando a tabela de produtos

```sql
CREATE TABLE produtos (
    id         INT            AUTO_INCREMENT PRIMARY KEY,
    nome       VARCHAR(100)   NOT NULL,
    preco      DECIMAL(10,2)  NOT NULL,
    quantidade INT            NOT NULL DEFAULT 0,
    categoria  VARCHAR(100)
);
```

### `preco DECIMAL(10,2) NOT NULL`

```sql
preco DECIMAL(10,2) NOT NULL
```

- **`DECIMAL(10, 2)`** — número decimal com até 10 dígitos no total, sendo 2 deles após a vírgula
  - `10` dígitos no total significa que o maior valor possível é `99999999.99`
  - `2` casas decimais: `49.90`, `1299.00`, `0.99`
- Nunca use `FLOAT` ou `DOUBLE` para valores monetários — esses tipos têm imprecisão em cálculos decimais. `DECIMAL` é exato

### `quantidade INT NOT NULL DEFAULT 0`

```sql
quantidade INT NOT NULL DEFAULT 0
```

- **`DEFAULT 0`** — se o campo quantidade não for informado na inserção, o banco usa `0` automaticamente

---

## Passo 4 — Testando com INSERT e SELECT

Antes de conectar ao Node.js, teste as tabelas diretamente no Workbench:

```sql
-- Inserindo um usuário de teste
INSERT INTO usuarios (nome, email, senha, cidade, estado)
VALUES ('João Silva', 'joao@email.com', '123456', 'Curitiba', 'PR');

-- Buscando todos os usuários
SELECT * FROM usuarios;

-- Inserindo um produto de teste
INSERT INTO produtos (nome, preco, quantidade, categoria)
VALUES ('Camiseta Básica', 49.90, 100, 'Roupas');

-- Buscando todos os produtos
SELECT * FROM produtos;
```

Se os registros aparecerem na consulta, o banco está funcionando corretamente.

O `--` no início de uma linha indica **comentário** em SQL — o banco ignora essa linha.

---

## Passo 5 — Criando config/database.js

Agora vamos conectar o Node.js ao MySQL. Crie o arquivo `config/database.js`:

```js
const mysql = require('mysql2')

const conexao = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'meuCrud'
})

conexao.connect((erro) => {
    if (erro) {
        console.log('Erro ao conectar ao banco:', erro)
        return
    }

    console.log('Banco conectado com sucesso!')
})

module.exports = conexao
```

Vamos analisar cada parte em detalhes.

---

### `const mysql = require('mysql2')`

```js
const mysql = require('mysql2')
```

Importa o pacote `mysql2` que instalamos com `npm install`. Esse pacote fornece todas as funções necessárias para se comunicar com o MySQL a partir do Node.js.

`mysql` agora é um objeto com métodos como `mysql.createConnection()`.

---

### `mysql.createConnection({})`

```js
const conexao = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'meuCrud'
})
```

**`mysql.createConnection()`** cria e configura uma conexão com o banco de dados.

Ela recebe **um argumento**: um objeto de configuração com as propriedades:

| Propriedade | O que define | Valor no projeto |
|-------------|-------------|------------------|
| `host` | Endereço do servidor MySQL | `'localhost'` — o MySQL está no mesmo computador |
| `port` | Porta do MySQL | `3306` — porta padrão do MySQL |
| `user` | Nome do usuário do banco | `'root'` — usuário administrador padrão |
| `password` | Senha do usuário | `'123456'` — a senha definida na instalação |
| `database` | Nome do banco de dados | `'meuCrud'` — o banco que criamos |

**`mysql.createConnection()` retorna** um objeto de conexão, que armazenamos em `conexao`. Esse objeto tem métodos como `conexao.connect()` e `conexao.query()`.

Atenção: neste ponto, a conexão ainda **não foi estabelecida**. `createConnection` apenas configura os parâmetros. A conexão é efetivada na próxima linha.

---

### `conexao.connect(callback)`

```js
conexao.connect((erro) => {
    if (erro) {
        console.log('Erro ao conectar ao banco:', erro)
        return
    }

    console.log('Banco conectado com sucesso!')
})
```

**`conexao.connect()`** tenta estabelecer a conexão com o MySQL.

Ela recebe **um argumento**: uma função **callback**.

#### O que é um callback?

Um **callback** é uma função passada como argumento para outra função, para ser executada depois que uma operação assíncrona terminar.

O Node.js é **assíncrono**: ele não espera uma operação terminar para continuar executando o código. Quando pedimos para conectar ao banco de dados, o Node.js inicia a conexão e continua rodando — quando a conexão termina (com sucesso ou erro), o Node.js chama o callback com o resultado.

A função callback recebe **um parâmetro**: `erro`.

- Se a conexão falhou, `erro` contém um objeto com informações sobre o erro
- Se a conexão foi bem-sucedida, `erro` é `null` (sem valor)

#### O padrão error-first callback

No Node.js, é convenção que callbacks coloquem o **erro como primeiro parâmetro**. Isso se chama "error-first callback pattern":

```js
(erro, resultado) => {
    if (erro) {
        // tratamento do erro
        return
    }
    // uso do resultado
}
```

#### `if (erro) { return }`

```js
if (erro) {
    console.log('Erro ao conectar ao banco:', erro)
    return
}
```

- **`if (erro)`** — em JavaScript, `null` e `undefined` são falsy (falsos). Então `if (erro)` só executa o bloco se `erro` for um objeto de erro real
- **`return`** — interrompe a execução do callback. Sem o `return`, o código continuaria para o `console.log('Banco conectado!')` mesmo com erro

---

### `module.exports = conexao`

```js
module.exports = conexao
```

**`module.exports`** define o que este arquivo vai "oferecer" para outros arquivos que o importarem com `require()`.

Sem `module.exports`, o arquivo roda normalmente mas não compartilha nada com o resto do projeto.

Com `module.exports = conexao`, qualquer arquivo que fizer:

```js
const conexao = require('./config/database')
```

receberá o objeto de conexão com o banco de dados — pronto para usar.

---

## `module.exports` e `require` entre arquivos

Na Aula 1, usamos `require('express')` e `require('path')` para importar **pacotes** (de `node_modules`). Agora vamos usar `require` para importar **nossos próprios arquivos**.

A diferença está no primeiro argumento:

```js
// Importando um pacote (começa sem ./ ou /)
const express = require('express')

// Importando um arquivo do projeto (começa com ./ ou ../)
const conexao = require('./config/database')
```

- **`'express'`** — o Node.js busca dentro de `node_modules`
- **`'./config/database'`** — o Node.js busca o arquivo `config/database.js` a partir da pasta do arquivo atual
  - `./` significa "na pasta atual"
  - `../` significa "na pasta acima"
  - A extensão `.js` pode ser omitida — o Node.js a adiciona automaticamente

---

## Passo 6 — Registrando a conexão no index.js

Abra o `index.js` e adicione o `require` da conexão logo no início, após os outros imports:

```js
const express = require('express')
const path = require('path')

require('./config/database')   // ← adicione esta linha

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

app.use((req, res) => {
    res.status(404).send('Página não encontrada.')
})

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})
```

Repare que não armazenamos o resultado em uma variável aqui (`const conexao = ...`). Apenas executamos o arquivo para que a conexão seja estabelecida quando o servidor inicia. Nas próximas aulas, os arquivos de model importarão a conexão diretamente.

---

## Passo 7 — Testando a conexão

Reinicie o servidor:

```bash
node index.js
```

O terminal deve exibir as duas mensagens — primeiro a do banco, depois a do servidor (porque a conexão ao banco é assíncrona):

```
Servidor rodando em http://localhost:8000
Banco conectado com sucesso!
```

Se aparecer `Erro ao conectar ao banco:`, verifique:
- O MySQL está rodando? (MySQL Workbench consegue conectar?)
- A senha em `config/database.js` é a mesma definida na instalação?
- O banco `meuCrud` foi criado?

---

## Como o mysql2 executa queries — prévia

Nas próximas aulas, usaremos o método `conexao.query()` nos models para executar SQL a partir do Node.js:

```js
conexao.query(sql, valores, callback)
```

**`conexao.query()`** recebe três argumentos:

1. **`sql`** — a string com o comando SQL, usando `?` como marcadores de posição para os valores:
   ```js
   const sql = 'SELECT * FROM usuarios WHERE id = ?'
   ```

2. **`valores`** — um array com os valores que substituirão os `?` na ordem:
   ```js
   const valores = [5]
   // O SQL executado será: SELECT * FROM usuarios WHERE id = 5
   ```
   Usar `?` em vez de concatenar strings é uma proteção contra **SQL Injection** — um tipo de ataque onde o usuário malicioso insere SQL dentro dos dados do formulário para manipular o banco.

3. **`callback`** — função executada quando a query termina, recebendo `(erro, resultados)`:
   ```js
   (erro, resultados) => {
       if (erro) {
           console.log(erro)
           return
       }
       console.log(resultados) // array com as linhas retornadas
   }
   ```

Não se preocupe em memorizar isso agora — na próxima aula vamos usar `conexao.query()` na prática ao criar os models.

---

## Visualizando o fluxo completo

```
Servidor inicia (node index.js)
        ↓
index.js é executado
        ↓
require('./config/database') → executa database.js
        ↓
mysql.createConnection({...}) → configura os parâmetros
        ↓
conexao.connect(callback) → Node.js inicia a conexão (assíncrono)
        ↓
Node.js continua: app.listen(8000) → servidor começa a escutar
        ↓
(quando a conexão ao banco conclui)
        ↓
callback é chamado com erro = null
        ↓
'Banco conectado com sucesso!' aparece no terminal
```

---

## Recapitulação

### O que aprendemos

- O que é um banco de dados relacional e por que precisamos dele
- Conceitos fundamentais: tabelas, linhas, colunas, chave primária, AUTO_INCREMENT
- O que é SQL e a diferença entre DDL (estrutura) e DML (dados)
- Os principais tipos de dados do MySQL: `INT`, `VARCHAR`, `CHAR`, `DECIMAL`, `DATE`, `ENUM`
- As restrições de coluna: `NOT NULL`, `UNIQUE`, `DEFAULT`
- Como criar banco de dados e tabelas com `CREATE DATABASE` e `CREATE TABLE`
- O que é um callback e o padrão error-first callback do Node.js
- Como funciona `mysql.createConnection()` e cada propriedade de configuração
- Como funciona `conexao.connect()` e seu callback com `erro`
- O que é `module.exports` e como ele compartilha código entre arquivos
- A diferença entre `require('pacote')` e `require('./arquivo')`
- Como o `?` no SQL protege contra SQL Injection

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `config/database.js` | Configuração e conexão com o MySQL, exporta o objeto de conexão |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `index.js` | Adicionado `require('./config/database')` para iniciar a conexão ao subir o servidor |

**No banco de dados MySQL (meuCrud):**

| Tabela | Colunas criadas |
|--------|-----------------|
| `usuarios` | `id`, `nome`, `email`, `senha`, `telefone`, `genero`, `data_nascimento`, `cidade`, `estado`, `endereco` |
| `produtos` | `id`, `nome`, `preco`, `quantidade`, `categoria` |

**Estado do servidor ao final da aula:**

```
node index.js
→ Servidor rodando em http://localhost:8000
→ Banco conectado com sucesso!
→ GET /           → public/index.html              ✓
→ GET /formulario.html → servido como estático     ✓
→ POST /usuarios  → console.log + redirect         ✓
→ Dados de usuarios/produtos salvos no banco       ✗ (próxima aula)
```

**O que ainda não funciona:** o formulário envia dados ao servidor, mas o servidor ainda não os salva no banco. Precisamos criar os **models** — isso é a próxima aula.

---

## Na próxima aula

Na **Aula 4** vamos criar a camada Model — as funções que executam SQL a partir do Node.js:
- Criar `models/usuarioModel.js`
- Escrever a função `criarUsuario()` com `INSERT INTO`
- Escrever a função `listarUsuarios()` com `SELECT *`
- Entender o padrão de callback nos models
- Importar o model no controller e começar a salvar dados reais no banco
