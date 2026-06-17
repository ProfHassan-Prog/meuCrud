# Aula 12 — Validação Client-Side com JavaScript

## Revisão da Aula 11

Na aula anterior:
- Criamos `public/css/forms.css` com layout de card centralizado
- Aprendemos `max-width`, seletor com vírgula, `.form-card.wide`, o problema dos radio buttons, `accent-color` e o atributo `for`/`id`
- Estilizamos `index.html`, `formulario.html` e `produto.html`

O sistema está completo e bem apresentado. Esta última aula adiciona **validação de formulários no browser** — verificar os dados antes de enviá-los ao servidor, com mensagens de erro imediatas ao lado de cada campo.

---

## Validação client-side vs. server-side

**Validação server-side** acontece no Node.js, depois que os dados já foram enviados:

```
usuário envia → Node.js recebe → valida → salva ou retorna erro
```

**Validação client-side** acontece no browser, antes de enviar:

```
usuário preenche → JavaScript valida → se ok, envia → Node.js recebe → salva
```

### Por que as duas juntas?

| | Client-side (browser) | Server-side (Node.js) |
|--|----------------------|----------------------|
| **Quando acontece** | Antes de enviar | Depois de receber |
| **Feedback** | Imediato, sem recarregar a página | Depende de um round-trip ao servidor |
| **Pode ser bypassada** | Sim — JS pode ser desativado, Postman não tem JS | Não — sempre executa |
| **Para quê serve** | Melhor experiência do usuário | Segurança e integridade dos dados |

**Conclusão:** client-side não substitui server-side. Client-side melhora a UX; server-side garante a segurança. Neste projeto, usamos client-side para o formulário e o servidor confia nos dados recebidos (suficiente para um sistema de estudo).

---

## O DOM — Document Object Model

O browser transforma o HTML em uma estrutura de objetos JavaScript chamada **DOM** (Document Object Model). Cada elemento HTML vira um objeto com propriedades e métodos que podemos ler e modificar.

```html
<input type="text" id="nome" value="João">
```

Depois que o browser processar esse HTML, podemos acessá-lo pelo JavaScript:

```js
const campo = document.getElementById('nome')
campo.value          // 'João'
campo.classList      // lista de classes CSS do elemento
campo.textContent    // texto visível dentro do elemento
```

`document` é o objeto global que representa o documento HTML inteiro. Todos os métodos de seleção partem dele.

---

## Selecionando elementos do DOM

### `document.getElementById(id)`

Retorna o elemento que tem o atributo `id` especificado. Retorna `null` se não encontrar.

```js
document.getElementById('nome')    // → o elemento <input id="nome">
document.getElementById('email')   // → o elemento <input id="email">
```

### `document.querySelector(seletor)`

Retorna o **primeiro** elemento que combina com o seletor CSS. Aceita qualquer seletor CSS válido.

```js
document.querySelector('form')          // → o primeiro <form> na página
document.querySelector('#nome')         // → mesmo que getElementById('nome')
document.querySelector('.form-error')   // → primeiro elemento com classe form-error
```

### `document.querySelectorAll(seletor)`

Retorna **todos** os elementos que combinam com o seletor, como uma `NodeList` (similar a um array).

```js
document.querySelectorAll('.form-error')   // → NodeList com todos os spans de erro
document.querySelectorAll('.invalid')      // → NodeList com todos os campos inválidos
```

`NodeList` tem o método `.forEach()`, assim como arrays:

```js
document.querySelectorAll('.form-error').forEach(span => {
    span.textContent = ''   // limpa o texto de cada span de erro
})
```

---

## `addEventListener` — escutando eventos

O browser dispara **eventos** quando o usuário interage com a página: cliques, digitação, envio de formulário, movimento do mouse, etc.

`addEventListener(tipoDeEvento, função)` registra uma função que será chamada toda vez que aquele evento ocorrer:

```js
const botao = document.getElementById('meu-botao')

botao.addEventListener('click', function() {
    console.log('botão foi clicado!')
})
```

A função registrada (o callback) é chamada automaticamente pelo browser quando o evento ocorre.

### O evento `submit`

O evento `submit` é disparado quando um formulário é enviado — seja pelo clique no botão `type="submit"` ou pressionando Enter em um campo de texto.

```js
const form = document.querySelector('form')

form.addEventListener('submit', function(event) {
    // chamado ao submeter o formulário
})
```

O callback recebe um objeto `event` com informações sobre o evento e métodos para controlá-lo.

---

## `event.preventDefault()` — interceptando o envio

Por padrão, quando um formulário é submetido, o browser navega para a URL do `action`. `preventDefault()` cancela esse comportamento padrão:

```js
form.addEventListener('submit', function(event) {
    event.preventDefault()
    // o formulário NÃO foi enviado ainda

    // validamos aqui...

    if (tudoValido) {
        form.submit()   // enviamos manualmente após validar
    }
    // se não for válido, simplesmente não chamamos form.submit()
})
```

**`event.target`** — o elemento que disparou o evento. Dentro do callback do `submit`, `event.target` é o próprio `<form>`.

---

## `element.value` e `.trim()`

**`.value`** — lê o valor atual de um `<input>` ou `<select>`:

```js
document.getElementById('email').value   // 'joao@email.com'
```

**`.trim()`** — remove espaços em branco do início e do final da string:

```js
'  joão  '.trim()    // 'joão'
'joão'.trim()        // 'joão'  (sem efeito se já não há espaços)
```

Sempre use `.trim()` ao validar campos de texto. Sem ele, um campo preenchido com espaços passaria numa verificação de `campo.length > 0`.

---

## `classList` — manipulando classes CSS

**`element.classList.add('classe')`** — adiciona uma classe ao elemento:

```js
campo.classList.add('invalid')   // adiciona class="invalid"
```

**`element.classList.remove('classe')`** — remove a classe:

```js
campo.classList.remove('invalid')   // remove class="invalid"
```

**`element.classList.contains('classe')`** — verifica se a classe está presente:

```js
campo.classList.contains('invalid')   // true ou false
```

Essas operações modificam as classes do elemento em tempo real — o CSS correspondente é aplicado ou removido instantaneamente.

---

## Expressão regular — validando email

Uma **expressão regular** (regex) é um padrão para verificar se uma string tem um determinado formato.

```js
const padrao = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

padrao.test('joao@email.com')     // true  — email válido
padrao.test('joao')               // false — sem @
padrao.test('@email.com')         // false — sem texto antes do @
padrao.test('joao@')              // false — sem domínio
padrao.test('joao @email.com')    // false — tem espaço
```

`.test(string)` retorna `true` se a string combina com o padrão, `false` caso contrário.

Não é necessário entender cada caractere do padrão para usá-lo — basta saber o que ele valida. Este padrão verifica a estrutura básica `texto@texto.texto`.

---

## Parte 1 — Adicionando estilos de erro ao `forms.css`

Adicione ao final de `public/css/forms.css`:

```css
/* ── Validação ── */
.form-error {
    display: block;
    color: #e74c3c;
    font-size: 0.8rem;
    margin-top: 5px;
    min-height: 1.1em;
}

.form-group input.invalid,
.form-group select.invalid {
    border-color: #e74c3c;
    box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.12);
}
```

**`min-height: 1.1em`** no `.form-error` — reserva espaço para a mensagem de erro mesmo quando ela está vazia (`textContent = ''`). Sem isso, os campos "pulam" para baixo quando a mensagem aparece, causando um salto visual (layout shift).

**`.form-group input.invalid`** — seletor combinado (sem espaço entre `input` e `.invalid`): afeta `<input>` que tenha **ao mesmo tempo** a classe `invalid`. Muda a borda para vermelho quando o campo falha na validação.

---

## Parte 2 — Validação do `formulario.html`

### Adicionando spans de erro

Para cada campo a ser validado, adicione um `<span>` vazio imediatamente após o `<input>`. O `id` do span segue o padrão `erro-nomeDoCampo`:

```html
<div class="form-group">
    <label for="nome">Nome completo</label>
    <input type="text" id="nome" name="nome" required placeholder="João da Silva">
    <span id="erro-nome" class="form-error"></span>
</div>

<div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" name="email" required placeholder="joao@email.com">
    <span id="erro-email" class="form-error"></span>
</div>

<div class="form-group">
    <label for="senha">Senha</label>
    <input type="password" id="senha" name="senha" required>
    <span id="erro-senha" class="form-error"></span>
</div>
```

Para os demais campos (telefone, data, cidade, estado, endereço), não adicionamos validação aqui pois são opcionais — mas você pode adicionar se quiser praticar.

### Adicionando o script de validação

Adicione ao final do `formulario.html`, antes de `</body>`:

```html
<script>
    const form = document.querySelector('form')

    form.addEventListener('submit', function(event) {
        event.preventDefault()

        limparErros()

        const nome  = document.getElementById('nome').value.trim()
        const email = document.getElementById('email').value.trim()
        const senha = document.getElementById('senha').value

        let valido = true

        if (nome.length < 3) {
            mostrarErro('nome', 'O nome deve ter pelo menos 3 caracteres.')
            valido = false
        }

        if (!emailValido(email)) {
            mostrarErro('email', 'Informe um email válido.')
            valido = false
        }

        if (senha.length < 6) {
            mostrarErro('senha', 'A senha deve ter pelo menos 6 caracteres.')
            valido = false
        }

        if (valido) {
            form.submit()
        }
    })

    function limparErros() {
        document.querySelectorAll('.form-error').forEach(span => span.textContent = '')
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'))
    }

    function mostrarErro(campoId, mensagem) {
        document.getElementById(campoId).classList.add('invalid')
        document.getElementById('erro-' + campoId).textContent = mensagem
    }

    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }
</script>
```

---

### Analisando cada bloco em detalhes

#### `form.addEventListener('submit', function(event) { ... })`

Registra o callback para o evento `submit`. O callback recebe `event` — usamos `event.preventDefault()` para cancelar o envio padrão e `form.submit()` no final para enviar quando tudo estiver correto.

---

#### `limparErros()`

```js
function limparErros() {
    document.querySelectorAll('.form-error').forEach(span => span.textContent = '')
    document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'))
}
```

Chamada no início de cada validação para limpar o estado anterior. Se o usuário tentou enviar, corrigiu os campos e tentou de novo, não queremos que mensagens antigas de erros já corrigidos continuem aparecendo.

**`span.textContent = ''`** — define o texto visível do elemento como vazio. Diferente de `span.innerHTML = ''` (que remove HTML interno), `textContent` trabalha apenas com texto puro.

---

#### O fluxo de validação com `let valido = true`

```js
let valido = true

if (nome.length < 3) {
    mostrarErro('nome', 'O nome deve ter pelo menos 3 caracteres.')
    valido = false
}

if (!emailValido(email)) {
    mostrarErro('email', 'Informe um email válido.')
    valido = false
}

if (senha.length < 6) {
    mostrarErro('senha', 'A senha deve ter pelo menos 6 caracteres.')
    valido = false
}

if (valido) {
    form.submit()
}
```

Usamos `let valido = true` e depois `valido = false` para cada erro encontrado — em vez de parar na primeira falha. Isso permite mostrar **todos os erros de uma vez**, poupando o usuário de corrigir um campo, tentar novamente, descobrir o próximo erro, e assim por diante.

**`if (!emailValido(email))`** — o `!` inverte o booleano: `!true` = `false`, `!false` = `true`. Então: se `emailValido` retornar `false` (email inválido), `!false` = `true` → entra no if e mostra o erro.

---

#### `mostrarErro(campoId, mensagem)`

```js
function mostrarErro(campoId, mensagem) {
    document.getElementById(campoId).classList.add('invalid')
    document.getElementById('erro-' + campoId).textContent = mensagem
}
```

Recebe o `id` do campo e a mensagem. Faz duas coisas:
1. Adiciona a classe `invalid` ao input → borda fica vermelha (via CSS)
2. Define o `textContent` do span de erro → mensagem aparece abaixo do campo

A convenção `'erro-' + campoId` funciona porque demos aos spans o `id` no padrão `erro-nome`, `erro-email`, `erro-senha`.

---

## Parte 3 — Validação do `produto.html`

Adicione os spans de erro nos campos obrigatórios:

```html
<div class="form-group">
    <label for="nome">Nome do produto</label>
    <input type="text" id="nome" name="nome" required placeholder="Notebook Dell">
    <span id="erro-nome" class="form-error"></span>
</div>

<div class="form-row">
    <div class="form-group">
        <label for="preco">Preço (R$)</label>
        <input type="number" id="preco" name="preco" step="0.01" min="0" required placeholder="0,00">
        <span id="erro-preco" class="form-error"></span>
    </div>
    <div class="form-group">
        <label for="quantidade">Quantidade</label>
        <input type="number" id="quantidade" name="quantidade" min="0" required placeholder="0">
        <span id="erro-quantidade" class="form-error"></span>
    </div>
</div>
```

E o script de validação antes de `</body>`:

```html
<script>
    const form = document.querySelector('form')

    form.addEventListener('submit', function(event) {
        event.preventDefault()

        limparErros()

        const nome       = document.getElementById('nome').value.trim()
        const preco      = parseFloat(document.getElementById('preco').value)
        const quantidade = parseInt(document.getElementById('quantidade').value, 10)

        let valido = true

        if (nome.length === 0) {
            mostrarErro('nome', 'O nome do produto é obrigatório.')
            valido = false
        }

        if (isNaN(preco) || preco <= 0) {
            mostrarErro('preco', 'Informe um preço maior que zero.')
            valido = false
        }

        if (isNaN(quantidade) || quantidade < 0) {
            mostrarErro('quantidade', 'Informe uma quantidade válida (zero ou mais).')
            valido = false
        }

        if (valido) {
            form.submit()
        }
    })

    function limparErros() {
        document.querySelectorAll('.form-error').forEach(span => span.textContent = '')
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'))
    }

    function mostrarErro(campoId, mensagem) {
        document.getElementById(campoId).classList.add('invalid')
        document.getElementById('erro-' + campoId).textContent = mensagem
    }
</script>
```

### `parseFloat`, `parseInt` e `isNaN`

**`parseFloat(string)`** — converte string para número decimal:

```js
parseFloat('29.90')   // 29.9
parseFloat('abc')     // NaN
parseFloat('')        // NaN
```

**`parseInt(string, base)`** — converte string para número inteiro. O segundo argumento `10` especifica base decimal (sempre use para evitar comportamentos inesperados com strings como `'08'`):

```js
parseInt('5', 10)     // 5
parseInt('5.7', 10)   // 5  (trunca o decimal)
parseInt('abc', 10)   // NaN
```

**`isNaN(valor)`** — verifica se o valor é `NaN` (Not a Number). Retorna `true` se for inválido:

```js
isNaN(NaN)      // true
isNaN(29.9)     // false
isNaN('abc')    // true — tenta converter e falha
```

Usamos `isNaN(preco) || preco <= 0` para cobrir dois casos: campo vazio/inválido (`NaN`) ou valor negativo/zero.

---

## Parte 4 — Melhorando a validação do login (`index.html`)

Substitua o `<script>` existente por uma versão com mensagem de erro na tela em vez de `alert()`:

Primeiro, adicione um span de erro no HTML, abaixo do campo de senha:

```html
<div class="form-group">
    <label for="senha">Senha</label>
    <input type="password" id="senha" placeholder="••••••">
    <span id="erro-login" class="form-error"></span>
</div>
```

E o script atualizado:

```html
<script>
    document.getElementById('btn-entrar').addEventListener('click', function() {
        const usuario = document.getElementById('usuario').value.trim()
        const senha   = document.getElementById('senha').value
        const erroSpan = document.getElementById('erro-login')

        if (usuario === 'admin' && senha === 'admin') {
            window.location.href = '/adm'
        } else {
            erroSpan.textContent = 'Usuário ou senha inválidos.'
            document.getElementById('senha').classList.add('invalid')
        }
    })
</script>
```

**`window.location.href = '/adm'`** — navega o browser para a URL especificada. `window` é o objeto global do browser (a janela); `location.href` é a URL atual.

---

## Testando a validação

Reinicie o servidor e acesse os formulários.

**Teste 1 — Formulário de usuário sem preencher:**
Clique em "Cadastrar" sem preencher nada. Todos os três campos obrigatórios devem ficar com borda vermelha e mensagens de erro embaixo. O formulário NÃO deve ser enviado.

**Teste 2 — Email inválido:**
Digite um nome válido, um email sem `@` e uma senha curta. Os campos com problema ficam em vermelho; o campo de nome (se válido) permanece normal.

**Teste 3 — Corrigir e enviar:**
Corrija todos os campos com erro. Ao clicar em Cadastrar novamente, os erros somem, o campo fica com borda normal e o formulário é enviado.

**Teste 4 — Produto com preço zero:**
Tente cadastrar um produto com preço `0`. A mensagem "Informe um preço maior que zero." deve aparecer.

**Teste 5 — Login errado:**
Na tela de login, tente entrar com credenciais erradas. A mensagem deve aparecer no campo em vez de um `alert()`.

---

## O fluxo completo de uma submissão válida

```
Usuário preenche o formulário e clica em "Cadastrar"
        ↓
Browser dispara o evento 'submit' no <form>
        ↓
form.addEventListener('submit', ...) — nosso callback é chamado
        ↓
event.preventDefault() — browser NÃO navega para /usuarios ainda
        ↓
limparErros() — remove erros da tentativa anterior (se houver)
        ↓
Lê os valores: nome = 'João Silva', email = 'joao@email.com', senha = '123456'
        ↓
Validações:
    nome.length (10) >= 3          → ok, valido continua true
    emailValido('joao@email.com')  → true, !true = false → não entra no if
    senha.length (6) >= 6          → ok, valido continua true
        ↓
valido === true → form.submit()
        ↓
Browser envia POST /usuarios com os dados do formulário
        ↓
Express → usuarioController.criarUsuario → usuarioModel → MySQL
        ↓
res.redirect('/adm') → painel abre com o novo usuário na tabela
```

---

## Recapitulação da Aula 12

### O que aprendemos

- A distinção entre validação client-side (UX) e server-side (segurança) — e por que as duas são necessárias juntas
- O DOM: o browser transforma HTML em objetos JavaScript manipuláveis
- `document.getElementById(id)` — acessa um elemento pelo `id`
- `document.querySelector(seletor)` — acessa o primeiro elemento que combina com um seletor CSS
- `document.querySelectorAll(seletor)` — acessa todos os elementos, retorna NodeList com `.forEach()`
- `addEventListener('submit', callback)` — registra uma função para ser chamada quando o formulário for submetido
- `event.preventDefault()` — cancela o envio padrão para validarmos antes
- `element.value.trim()` — lê o valor do input e remove espaços das bordas
- `element.classList.add/remove('classe')` — adiciona/remove classes CSS em tempo real
- `element.textContent = 'mensagem'` — define o texto visível de um elemento
- O padrão `let valido = true` + múltiplos ifs — mostra todos os erros de uma vez
- `parseFloat`, `parseInt(string, 10)` — converte string de input para número
- `isNaN(valor)` — verifica se o valor resultou em Not a Number
- Regex `/padrão/.test(string)` — verifica se uma string combina com um padrão
- `window.location.href = '/url'` — navega o browser programaticamente
- `min-height: 1.1em` no span de erro — reserva espaço para evitar layout shift
- `.form-group input.invalid` — seletor combinado para estilizar apenas inputs com a classe invalid

### O que fizemos no projeto

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `public/css/forms.css` | Adicionados `.form-error` e `.form-group input.invalid` |
| `public/formulario.html` | Spans de erro em nome, email, senha; script de validação |
| `public/produto.html` | Spans de erro em nome, preco, quantidade; script de validação |
| `public/index.html` | Span de erro no login; `alert()` substituído por mensagem inline |

---

## O sistema completo — o que foi construído nas 12 aulas

```
public/
    index.html         → login com validação JS
    formulario.html    → cadastro de usuário com validação JS
    produto.html       → cadastro de produto com validação JS
    css/
        style.css      → estilos do painel ADM
        forms.css      → estilos dos formulários públicos

config/
    database.js        → conexão MySQL com mysql2

models/
    usuarioModel.js    → SQL: INSERT, SELECT, SELECT LIKE, SELECT WHERE, UPDATE, DELETE
    produtoModel.js    → mesmo padrão para produtos

controllers/
    usuarioController.js → criarUsuario, mostrarFormularioEdicao, atualizarUsuario, deletarUsuario
    produtoController.js → mesmo padrão para produtos
    admController.js     → painelAdm com busca, duas tabelas, HTML dinâmico

routes/
    usuariosRoutes.js  → POST /, GET /:id/editar, POST /:id/editar, POST /:id/deletar
    produtosRoutes.js  → mesmo padrão para produtos
    admRoutes.js       → GET /

index.js               → servidor Express, middlewares, montagem de rotas
```

**Rotas cobertas pelo sistema:**

| Método | URL | O que faz |
|--------|-----|-----------|
| `GET` | `/` | Tela de login |
| `GET` | `/formulario.html` | Formulário de novo usuário |
| `GET` | `/produto.html` | Formulário de novo produto |
| `GET` | `/adm` | Painel com listagem e busca |
| `GET` | `/adm?busca_usuario=termo` | Painel filtrando usuários |
| `GET` | `/adm?busca_produto=termo` | Painel filtrando produtos |
| `POST` | `/usuarios` | Cria usuário |
| `GET` | `/usuarios/:id/editar` | Formulário pré-preenchido |
| `POST` | `/usuarios/:id/editar` | Atualiza usuário |
| `POST` | `/usuarios/:id/deletar` | Exclui usuário |
| `POST` | `/produtos` | Cria produto |
| `GET` | `/produtos/:id/editar` | Formulário pré-preenchido |
| `POST` | `/produtos/:id/editar` | Atualiza produto |
| `POST` | `/produtos/:id/deletar` | Exclui produto |

**Conceitos dominados ao longo das 12 aulas:**

| Camada | Conceitos |
|--------|-----------|
| Node.js | Runtime, módulos, `require`, `module.exports`, callbacks, assíncrono |
| Express | Servidor, rotas, middlewares, `req`/`res`, `req.body`, `req.params`, `req.query`, `express.Router()`, `express.static()` |
| MySQL | `CREATE TABLE`, `INSERT`, `SELECT`, `SELECT LIKE`, `UPDATE`, `DELETE`, `WHERE`, `ORDER BY`, `?` placeholders |
| MVC | Separação model/view/controller, responsabilidade única de cada camada |
| HTML | Forms, `method`, `action`, `name`, `type`, `required`, `<select>`, radio buttons, `<label for>` |
| CSS | Flexbox, `max-width`, pseudo-classes, seletores, especificidade, `transition`, `border-collapse`, `overflow: hidden` |
| JavaScript | DOM, `addEventListener`, `preventDefault`, `classList`, `textContent`, `querySelectorAll`, regex, `parseFloat`, `isNaN` |

---

## Próximos passos

Este projeto cobre as fundações do desenvolvimento web com Node.js. Tópicos que você pode explorar a seguir:

**No backend:**
- **Validação server-side** com a biblioteca `joi` ou validação manual em middleware Express
- **Senhas com hash** usando `bcrypt` — nunca salvar senha em texto puro
- **Sessões e autenticação real** com `express-session` — substituir o login hardcoded
- **Template engines** como `EJS` ou `Handlebars` — alternativa ao HTML inline nos controllers
- **Variáveis de ambiente** com `dotenv` — separar credenciais do código-fonte
- **ORM** com `Sequelize` ou `Prisma` — uma camada de abstração sobre o SQL puro

**No banco de dados:**
- **Relacionamentos** com `JOIN` — ligar tabelas (ex: produtos com categorias)
- **Migrations** — versionar as mudanças no schema do banco
- **Índices** — acelerar queries em tabelas grandes

**No frontend:**
- **Fetch API** — fazer requisições ao servidor sem recarregar a página
- **Frameworks modernos** — React, Vue ou Angular para aplicações SPA

**No projeto:**
- **Paginação** na listagem do painel para tabelas grandes
- **Upload de imagens** para produtos com `multer`
- **Deploy** em plataformas como Railway, Render ou VPS

O próximo nível natural é adicionar autenticação real com sessões — o login que criamos usa apenas JavaScript client-side e pode ser bypassado. Com `express-session`, o servidor mantém o estado da sessão e protege as rotas do painel.
