# Aula 9 — CSS: Estilizando o Painel Administrativo

## Revisão da Aula 8

Na aula anterior:
- Criamos o CRUD completo de produtos
- Aprendemos callbacks aninhados para executar duas consultas assíncronas em sequência
- Entendemos `DECIMAL` retornado como string e `Number().toFixed(2)` para formatação
- O painel ADM agora exibe usuários e produtos com botões de ação

O painel funciona corretamente, mas está sem estilo — tabelas com `border="1"`, sem layout, sem cores. Nesta aula adicionamos o CSS que transforma isso em uma interface administrativa real.

---

## Como o `express.static()` serve CSS para páginas dinâmicas

Nas aulas anteriores, servimos apenas arquivos HTML estáticos com `express.static()`. Mas CSS (e JavaScript do browser) também são arquivos — e são servidos exatamente da mesma forma.

Recapitulando o que `express.static()` faz no `index.js`:

```js
app.use(express.static(path.join(__dirname, 'public')))
```

Isso diz ao Express: **qualquer requisição cuja URL não bater em nenhuma rota definida, procure o arquivo correspondente dentro da pasta `public/`**.

Exemplos:
```
GET /formulario.html    → public/formulario.html       (HTML estático)
GET /css/style.css      → public/css/style.css         (CSS)
GET /css/forms.css      → public/css/forms.css         (CSS)
GET /js/app.js          → public/js/app.js             (JS do browser)
GET /imagens/logo.png   → public/imagens/logo.png      (imagem)
```

A URL `/css/style.css` mapeia para `public/css/style.css` porque o Express "monta" a pasta `public/` na raiz `/`.

### Linkando CSS numa página gerada dinamicamente

Quando o `admController.js` gera o HTML com `res.send(html)`, o browser recebe esse HTML e começa a interpretá-lo. Ao encontrar uma tag `<link>`, o browser **faz uma nova requisição** para buscar o arquivo CSS:

```
1. Browser faz GET /adm
2. Servidor responde com HTML contendo <link href="/css/style.css">
3. Browser vê a tag <link> e faz GET /css/style.css
4. express.static() encontra public/css/style.css e responde com o conteúdo
5. Browser aplica o CSS à página
```

Para que isso funcione, o `href` deve usar um **caminho absoluto** começando com `/`:

```html
<!-- CORRETO — caminho absoluto a partir da raiz do servidor -->
<link rel="stylesheet" href="/css/style.css">

<!-- ERRADO para páginas em rotas dinâmicas — caminho relativo -->
<link rel="stylesheet" href="css/style.css">
```

O caminho relativo `"css/style.css"` seria resolvido a partir da URL atual. Para a URL `/adm`, o browser tentaria buscar `/css/style.css` (coincidência que funciona aqui), mas para `/usuarios/3/editar` tentaria `/usuarios/3/css/style.css` — que não existe. O caminho absoluto `/css/style.css` funciona independentemente da URL atual.

---

## Parte 1 — Adicionando classes e o `<link>` no `admController.js`

Antes de escrever o CSS, precisamos adicionar classes HTML aos elementos gerados pelo controller. CSS funciona através de **seletores** que identificam elementos — os mais comuns são seletores de classe (`.nome-da-classe`).

### A estrutura com classes

Substitua o conteúdo do `controllers/admController.js`:

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
                                    ${linhasUsuarios}
                                </tbody>
                            </table>

                            <hr class="divider">

                            <div class="section-header">
                                <h2>Produtos (${produtos.length})</h2>
                                <a href="/produto.html" class="btn btn-primary">+ Novo produto</a>
                            </div>
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
                                    ${linhasProdutos}
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

### Classes aplicadas e o que cada uma fará

| Classe | Elemento | Responsabilidade no CSS |
|--------|----------|------------------------|
| `.layout` | `<div>` | Flex container horizontal (sidebar + content) |
| `.sidebar` | `<nav>` | Coluna fixa à esquerda, fundo escuro |
| `.sidebar-logo` | `<div>` | Logo/título da sidebar |
| `.nav-links` | `<ul>` | Lista de links de navegação |
| `.content` | `<main>` | Área principal que ocupa o restante |
| `.section-header` | `<div>` | Flex container para título + botão lado a lado |
| `.divider` | `<hr>` | Linha separadora entre as seções |
| `.actions` | `<td>` | Célula sem quebra de linha nos botões |
| `.btn` | `<a>` e `<button>` | Estilos base de botão |
| `.btn-primary` | `<a>` | Botão escuro para "Novo usuário/produto" |
| `.btn-edit` | `<a>` | Botão azul para editar |
| `.btn-delete` | `<button>` | Botão vermelho para excluir |

---

## Parte 2 — CSS: o que é e como o browser o aplica

CSS (Cascading Style Sheets) é uma linguagem que descreve como os elementos HTML devem ser exibidos. Cada regra CSS tem duas partes:

```css
seletor {
    propriedade: valor;
    propriedade: valor;
}
```

- **Seletor** — identifica quais elementos serão afetados
- **Propriedade: valor** — descreve o estilo a ser aplicado

Tipos de seletores:
```css
p { }          /* elemento — afeta TODOS os <p> */
.btn { }       /* classe — afeta elementos com class="btn" */
#logo { }      /* ID — afeta o elemento com id="logo" */
a:hover { }    /* pseudo-classe — estado do elemento */
```

Um elemento pode ter múltiplas classes separadas por espaço:

```html
<a class="btn btn-edit">Editar</a>
```

O CSS aplica regras de `.btn` E de `.btn-edit` a esse elemento — as propriedades se somam. Se uma propriedade aparecer em ambas, a regra mais específica vence.

---

## Parte 3 — Criando `public/css/style.css`

Crie a pasta `public/css/` e dentro dela o arquivo `style.css`. Vamos construir o CSS seção por seção.

### Reset e estilos base

```css
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f0f2f5;
    color: #333;
    font-size: 15px;
}
```

**`* { box-sizing: border-box }`** — o seletor `*` afeta **todos** os elementos da página. `box-sizing: border-box` muda como o browser calcula o tamanho dos elementos.

Por padrão (`content-box`), se um elemento tem `width: 200px` e `padding: 20px`, sua largura total fica `200 + 20 + 20 = 240px`. Com `border-box`, o `padding` fica **incluído** nos `200px` — o tamanho declarado é o tamanho final. Isso torna o layout muito mais previsível.

**`margin: 0; padding: 0`** — remove os espaços padrão que browsers adicionam a elementos como `<body>`, `<h1>`, `<p>`, `<ul>`. Sem isso, a página teria espaços brancos inesperados nas bordas.

**`font-family`** — define a fonte. `'Segoe UI'` é a fonte do Windows; as outras são alternativas para Mac e Linux. O browser usa a primeira disponível na lista.

---

### Layout com Flexbox

```css
.layout {
    display: flex;
    min-height: 100vh;
}
```

**`display: flex`** — transforma `.layout` em um **flex container**. Seus filhos diretos (`.sidebar` e `.content`) se tornam **flex items** e se posicionam por padrão **em linha horizontal** (lado a lado).

Sem Flexbox, elementos `<div>` são blocos que se empilham verticalmente. Com `display: flex`, eles se alinham horizontalmente — exatamente o que precisamos para o layout sidebar + conteúdo.

**`min-height: 100vh`** — `vh` é a unidade "viewport height" — 1vh = 1% da altura da janela do browser. `100vh` = altura total da janela. `min-height` (altura mínima) garante que o layout ocupe pelo menos a tela toda, mesmo com pouco conteúdo — sem deixar a sidebar cortada no meio da tela.

---

### Sidebar

```css
.sidebar {
    width: 220px;
    background: #2c3e50;
    color: white;
    padding: 24px 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
}
```

**`width: 220px`** — largura fixa da sidebar.

**`background: #2c3e50`** — cor de fundo em hexadecimal. `#2c3e50` é um azul-escuro/ardósia.

**`padding: 24px 0`** — padding interno. Quando `padding` recebe dois valores, o primeiro é para cima/baixo e o segundo para esquerda/direita. `24px 0` = 24px no topo e na base, 0 nos lados.

**`flex-shrink: 0`** — por padrão, flex items podem encolher se o container não tiver espaço suficiente. `flex-shrink: 0` proíbe a sidebar de encolher — ela sempre terá exatamente `220px`, mesmo se o conteúdo principal for muito largo.

**`display: flex; flex-direction: column`** — a sidebar também é um flex container, mas com direção vertical (`column`). Isso permite, futuramente, empurrar um link "Sair" para o rodapé usando `margin-top: auto`.

---

```css
.sidebar-logo {
    font-size: 1.3rem;
    font-weight: bold;
    padding: 0 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 12px;
    letter-spacing: 1px;
}
```

**`font-size: 1.3rem`** — `rem` é relativo ao tamanho da fonte do elemento `<html>` (normalmente 16px). `1.3rem` = 20.8px. É preferível a `px` fixo porque respeita as preferências de acessibilidade do usuário.

**`border-bottom: 1px solid rgba(255, 255, 255, 0.1)`** — linha sutil abaixo do logo. `rgba(255, 255, 255, 0.1)` é branco com 10% de opacidade — um separador discreto.

**`letter-spacing: 1px`** — espaçamento entre letras. Dá um aspecto mais "marca" ao título.

---

```css
.nav-links {
    list-style: none;
}

.nav-links a {
    display: block;
    padding: 10px 24px;
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
    font-size: 0.9rem;
}

.nav-links a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}
```

**`list-style: none`** — remove os marcadores (bullet points) padrão do `<ul>`.

**`.nav-links a { display: block }`** — por padrão, `<a>` é `inline` — só ocupa o espaço do texto. Com `display: block`, o link ocupa a largura total da sidebar, tornando a área clicável muito maior (melhor usabilidade).

**`color: rgba(255, 255, 255, 0.75)`** — branco com 75% de opacidade — levemente acinzentado, para diferenciar visualmente dos links ativos.

**`text-decoration: none`** — remove o sublinhado padrão dos links.

**`transition: background 0.2s, color 0.2s`** — anima suavemente as propriedades `background` e `color` durante 0.2 segundos. Sem isso, a mudança de cor no hover seria abrupta; com isso, é gradual.

**`.nav-links a:hover`** — `:hover` é uma **pseudo-classe** que se aplica quando o mouse está sobre o elemento. Muda o fundo para branco semitransparente e a cor do texto para branco total.

---

### Conteúdo principal

```css
.content {
    flex: 1;
    padding: 32px 40px;
    overflow: auto;
}

.content h1 {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 32px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
}
```

**`flex: 1`** — esta é a propriedade mais importante do layout. `flex: 1` é uma abreviação de `flex-grow: 1; flex-shrink: 1; flex-basis: 0`. Na prática: o `.content` ocupa **todo o espaço horizontal restante** após a sidebar de 220px. Se a janela tem 1200px de largura, a sidebar ocupa 220px e o content ocupa os outros 980px — e se a janela mudar de tamanho, o content ajusta automaticamente.

**`overflow: auto`** — se o conteúdo for maior que a área disponível, exibe barra de rolagem. Sem isso, o conteúdo transbordaria para fora da tela.

**`.content h1`** — seletor descendente: afeta `<h1>` que estão **dentro de** `.content`. Isso evita conflitos se houvesse outros `<h1>` na página.

---

### Cabeçalho de seção

```css
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h2 {
    font-size: 1.1rem;
    color: #2c3e50;
}

.divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 40px 0;
}
```

**`justify-content: space-between`** — distribui os flex items no eixo principal com o máximo de espaço entre eles. Com dois filhos (o `<h2>` e o `<a>`), um vai para a esquerda e o outro para a direita.

**`align-items: center`** — alinha os flex items verticalmente ao centro. Sem isso, o título e o botão ficariam alinhados pelo topo.

**`border: none; border-top: 1px solid`** — o `<hr>` tem borda em todos os lados por padrão. Zeramos todas com `border: none` e depois adicionamos apenas a borda superior, criando uma linha fina.

---

### Tabelas

```css
table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 8px;
}
```

**`width: 100%`** — a tabela ocupa toda a largura do `.content`.

**`border-collapse: collapse`** — propriedade específica de tabelas. Por padrão (`separate`), cada célula tem sua própria borda e há um espaço entre elas, resultando em bordas duplas. Com `collapse`, as bordas de células adjacentes se fundem em uma única linha.

**`border-radius: 8px`** — arredonda os cantos da tabela. Sozinho não funciona, porque as células `<td>` e `<th>` das bordas "vazam" para fora do raio.

**`overflow: hidden`** — faz a tabela "cortar" o conteúdo que ultrapassa os cantos arredondados. É isso que faz o `border-radius` funcionar na tabela: as células dos cantos ficam com os cantos cortados pelo `overflow: hidden` do pai.

**`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08)`** — sombra sutil abaixo da tabela. Os quatro valores são: deslocamento X, deslocamento Y, desfoque, cor. Uma sombra pequena e suave "levanta" a tabela do fundo.

---

```css
thead {
    background: #2c3e50;
    color: white;
}

th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f5;
    font-size: 0.9rem;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:hover {
    background: #f8fafc;
}
```

**`text-transform: uppercase`** — transforma o texto dos cabeçalhos em maiúsculas via CSS, sem alterar o HTML.

**`tbody tr:last-child td`** — seletor composto. Afeta `<td>` que estão dentro do `<tr>` que é o último filho (`:last-child`) dentro de `<tbody>`. Isso remove a borda inferior da última linha, evitando uma linha dupla com a borda da tabela.

**`tbody tr:hover`** — aplica cor de fundo ao `<tr>` quando o mouse passa sobre ele. `:hover` funciona em qualquer elemento HTML, não apenas em links.

**`:nth-child`** — outra pseudo-classe útil para linhas alternadas:
```css
tbody tr:nth-child(even) {
    background: #f8f9fa;
}
```
`:nth-child(even)` seleciona linhas pares (2ª, 4ª, 6ª...) — efeito "zebra". Não vamos usar aqui pois combinamos com `:hover`, mas vale conhecer.

---

### Botões

```css
.btn {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    font-family: inherit;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.15s;
}

.btn-primary {
    background: #2c3e50;
    color: white;
}

.btn-primary:hover {
    background: #34495e;
}

.btn-edit {
    background: #3498db;
    color: white;
    margin-right: 4px;
}

.btn-edit:hover {
    background: #2980b9;
}

.btn-delete {
    background: #e74c3c;
    color: white;
}

.btn-delete:hover {
    background: #c0392b;
}

.actions {
    white-space: nowrap;
}
```

**`display: inline-block`** — `<a>` é `inline` por padrão, o que impede `padding` vertical. `inline-block` permite padding em todas as direções mas mantém o elemento na linha.

**`cursor: pointer`** — exibe a mãozinha ao passar o mouse. `<button>` já tem isso por padrão, mas `<a>` também precisa para o visual ser consistente.

**`font-family: inherit`** — `<button>` tem sua própria fonte padrão (que varia por sistema operacional). `inherit` faz ele herdar a fonte do `body`.

**`font-weight: 500`** — peso da fonte. `400` é normal, `700` é bold. `500` é "medium" — levemente mais pesado que normal, sem ser negrito.

**`.actions { white-space: nowrap }`** — impede que os botões "Editar" e "Excluir" quebrem linha quando a tabela for estreita.

---

## O arquivo completo `public/css/style.css`

```css
/* ── Reset e base ── */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f0f2f5;
    color: #333;
    font-size: 15px;
}

/* ── Layout ── */
.layout {
    display: flex;
    min-height: 100vh;
}

/* ── Sidebar ── */
.sidebar {
    width: 220px;
    background: #2c3e50;
    color: white;
    padding: 24px 0;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
}

.sidebar-logo {
    font-size: 1.3rem;
    font-weight: bold;
    padding: 0 24px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 12px;
    letter-spacing: 1px;
}

.nav-links {
    list-style: none;
}

.nav-links a {
    display: block;
    padding: 10px 24px;
    color: rgba(255, 255, 255, 0.75);
    text-decoration: none;
    transition: background 0.2s, color 0.2s;
    font-size: 0.9rem;
}

.nav-links a:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

/* ── Conteúdo principal ── */
.content {
    flex: 1;
    padding: 32px 40px;
    overflow: auto;
}

.content h1 {
    font-size: 1.5rem;
    color: #2c3e50;
    margin-bottom: 32px;
    padding-bottom: 12px;
    border-bottom: 2px solid #e2e8f0;
}

/* ── Cabeçalho de seção ── */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.section-header h2 {
    font-size: 1.1rem;
    color: #2c3e50;
}

.divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 40px 0;
}

/* ── Tabelas ── */
table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    margin-bottom: 8px;
}

thead {
    background: #2c3e50;
    color: white;
}

th {
    padding: 12px 16px;
    text-align: left;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f2f5;
    font-size: 0.9rem;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:hover {
    background: #f8fafc;
}

/* ── Botões ── */
.btn {
    display: inline-block;
    padding: 6px 14px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 0.82rem;
    font-family: inherit;
    text-decoration: none;
    font-weight: 500;
    transition: background 0.15s;
}

.btn-primary {
    background: #2c3e50;
    color: white;
}

.btn-primary:hover {
    background: #34495e;
}

.btn-edit {
    background: #3498db;
    color: white;
    margin-right: 4px;
}

.btn-edit:hover {
    background: #2980b9;
}

.btn-delete {
    background: #e74c3c;
    color: white;
}

.btn-delete:hover {
    background: #c0392b;
}

.actions {
    white-space: nowrap;
}
```

---

## Testando o painel estilizado

Reinicie o servidor:

```bash
node index.js
```

Acesse `http://localhost:8000/adm`. O painel deve aparecer com:
- Sidebar escura à esquerda com links de navegação
- Área branca à direita com as tabelas
- Cabeçalhos das tabelas em azul-escuro
- Botões azuis (Editar) e vermelhos (Excluir)
- Hover suave ao passar o mouse nas linhas e nos links da sidebar

**Testando o hover:**
- Passe o mouse sobre as linhas da tabela — o fundo muda para azul claro
- Passe o mouse sobre os links da sidebar — o fundo clareia levemente
- Passe o mouse sobre os botões — a cor escurece ligeiramente

---

## Visualizando como o browser monta a página

```
Browser faz GET /adm
        ↓
Servidor executa painelAdm(), monta o HTML e responde
        ↓
Browser recebe o HTML e começa a interpretar
        ↓
Browser encontra: <link rel="stylesheet" href="/css/style.css">
        ↓
Browser faz uma segunda requisição: GET /css/style.css
        ↓
express.static() encontra public/css/style.css e responde com o arquivo
        ↓
Browser aplica o CSS a todos os elementos que combinam com os seletores
        ↓
Página renderizada com estilos
```

O browser pode fazer **múltiplas requisições** para montar uma única página: uma para o HTML, uma para cada CSS, uma para cada JavaScript, uma para cada imagem. O `express.static()` responde a todas elas automaticamente.

---

## Recapitulação

### O que aprendemos

- Como `express.static()` serve qualquer arquivo da pasta `public/` — não apenas HTML, mas CSS, JS, imagens e qualquer outro arquivo estático
- Por que o `href` do `<link>` deve usar caminho absoluto (`/css/style.css`) em vez de relativo — o relativo quebraria em URLs aninhadas como `/usuarios/:id/editar`
- O que são seletores CSS: elemento, classe (`.nome`), ID (`#nome`), pseudo-classe (`:hover`, `:last-child`)
- `* { box-sizing: border-box; margin: 0; padding: 0 }` — reset universal que torna o layout previsível
- `display: flex` no `.layout` — coloca sidebar e conteúdo lado a lado
- `flex-shrink: 0` — impede a sidebar de encolher
- `flex: 1` — faz o conteúdo principal ocupar todo o espaço restante
- `100vh` — a unidade viewport height, equivalente à altura da janela
- `border-collapse: collapse` — como funciona e por que é obrigatório para tabelas sem bordas duplas
- `overflow: hidden` em conjunto com `border-radius` para arredondar os cantos das tabelas
- `box-shadow` com 4 valores — deslocamentos X/Y, desfoque e cor
- `:hover` em `<tr>` e em `<a>` — pseudo-classe para interatividade visual
- `tbody tr:last-child td` — seletor composto para estilizar a última linha sem borda
- `transition` — como animar mudanças de propriedades CSS suavemente
- `white-space: nowrap` — impede quebra de linha em células de ação
- Classes múltiplas em um elemento: `class="btn btn-edit"` aplica regras de `.btn` e `.btn-edit` combinadas
- Seletor descendente `.content h1` — estiliza `<h1>` apenas dentro de `.content`

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `public/css/style.css` | Todos os estilos do painel ADM: layout flex, sidebar, tabelas, botões |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `controllers/admController.js` | Adicionado `<link>` ao CSS, estrutura `div.layout`, `nav.sidebar`, `main.content`, `.section-header`; classes CSS em todos os elementos relevantes |

**Visual do painel antes e depois:**

```
ANTES                          DEPOIS
─────────────────────────      ────────────────────────────────────────
                               │ MeuCRUD │  Painel Administrativo      │
Painel Administrativo          │─────────│─────────────────────────────│
                               │ Painel  │  Usuários (2)     [+Novo ▶] │
Usuários cadastrados (2)       │ Novo Us.│  ┌────┬──────┬──────┬──┐   │
+ Novo usuário                 │ Novo Pr.│  │ ID │ Nome │Email │..│   │
                               │         │  ├────┼──────┼──────┼──┤   │
[tabela sem estilo com         │         │  │ 1  │ João │j@... │[E][X]│
 border="1" simples]           │         │  │ 2  │Maria │m@... │[E][X]│
                               │         │  └────┴──────┴──────┴──┘   │
```

---

## Na próxima aula

Na **Aula 10** vamos adicionar busca ao painel administrativo:
- O que é `req.query` — parâmetros de URL do tipo `?busca=termo`
- Como o HTML submete uma busca com `<form method="GET">`
- Filtrar usuários e produtos pelo nome no controller
- Mostrar o campo de busca preenchido e um botão "Limpar" quando há filtro ativo
- A diferença entre formulários `GET` (busca, filtros) e `POST` (criação, alteração)
