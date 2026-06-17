# Aula 11 — CSS para as Páginas Públicas

## Revisão da Aula 10

Na aula anterior:
- Adicionamos busca ao painel com `req.query` e `GET` forms
- Aprendemos SQL `LIKE '%termo%'` para busca parcial
- Entendemos funções como valores para escolher dinamicamente qual model chamar
- Adicionamos estado vazio com `colspan` e o botão "Limpar"

O painel ADM está completo. Agora estilizamos as páginas públicas: a de login (`index.html`) e os formulários de cadastro (`formulario.html` e `produto.html`).

---

## Por que dois arquivos CSS separados

O painel ADM e as páginas públicas têm **layouts completamente diferentes**:

```
Painel ADM (style.css):           Páginas públicas (forms.css):

┌─────────┬──────────────────┐    ┌─────────────────────────────┐
│         │                  │    │                             │
│ sidebar │  conteúdo        │    │        ┌─────────┐         │
│         │  principal       │    │        │  card   │         │
│         │                  │    │        │ central │         │
│         │                  │    │        └─────────┘         │
└─────────┴──────────────────┘    └─────────────────────────────┘
    flex horizontal                   tela inteira centralizada
    sidebar fixa                      card com max-width
```

Se usássemos um único arquivo CSS, regras do painel (como `.sidebar`, `.content { flex: 1 }`) interfeririam nas páginas públicas, e vice-versa. Manter os dois contextos separados é mais limpo e mais fácil de manter.

Cada página HTML linka apenas o CSS que é seu:

```html
<!-- adm (gerado pelo controller) -->
<link rel="stylesheet" href="/css/style.css">

<!-- páginas públicas -->
<link rel="stylesheet" href="/css/forms.css">
```

---

## O padrão de centralização com Flexbox

Para centralizar um card na tela, tanto horizontal quanto verticalmente, usamos Flexbox no container que ocupa a tela inteira:

```css
.form-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
}
```

Recapitulando da Aula 9:
- `min-height: 100vh` — o container ocupa pelo menos a altura total da janela
- `display: flex` — ativa o modo flex
- `align-items: center` — centraliza filhos no **eixo transversal** (verticalmente, quando `flex-direction` é `row`)
- `justify-content: center` — centraliza filhos no **eixo principal** (horizontalmente, quando `flex-direction` é `row`)

Com as quatro propriedades combinadas, o filho único (o card) fica centrado em ambos os eixos.

**`padding: 32px 16px`** — evita que o card encoste nas bordas da tela em telas pequenas ou com muito conteúdo.

---

## `max-width` — o padrão "fluido até certo ponto"

```css
.form-card {
    width: 100%;
    max-width: 480px;
}
```

- **`width: 100%`** — o card ocupa toda a largura disponível. Em telas pequenas (celular de 380px), o card tem 380px (menos o padding do `.form-page`).
- **`max-width: 480px`** — em telas grandes (monitor de 1400px), o card para de crescer em 480px. Sem isso, o card ficaria enorme e os campos seriam impossíveis de ler.

É o padrão mais comum de CSS responsivo: **cresce em telas pequenas, limita em telas grandes**.

---

## Criando `public/css/forms.css`

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

/* ── Container de página ── */
.form-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
}

/* ── Card do formulário ── */
.form-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 40px;
    width: 100%;
    max-width: 480px;
}

.form-card.wide {
    max-width: 680px;
}

/* ── Cabeçalho do card ── */
.form-title {
    font-size: 1.4rem;
    color: #2c3e50;
    margin-bottom: 6px;
}

.form-subtitle {
    color: #6c757d;
    font-size: 0.9rem;
    margin-bottom: 32px;
}

/* ── Seção interna ── */
.form-section {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6c757d;
    font-weight: 600;
    margin: 28px 0 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

/* ── Grupo de campo ── */
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 9px 12px;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 0.95rem;
    font-family: inherit;
    color: #333;
    background: white;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

/* ── Linha com dois campos ── */
.form-row {
    display: flex;
    gap: 16px;
}

.form-row .form-group {
    flex: 1;
}

/* ── Grupo de rádio ── */
.radio-group {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    padding: 4px 0;
}

.radio-option {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 0.95rem;
    color: #374151;
}

.radio-option input[type="radio"] {
    width: auto;
    cursor: pointer;
    accent-color: #3498db;
}

/* ── Botão de envio ── */
.btn-submit {
    width: 100%;
    padding: 11px;
    background: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    margin-top: 8px;
    transition: background 0.2s;
}

.btn-submit:hover {
    background: #34495e;
}

/* ── Rodapé do formulário ── */
.form-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 0.875rem;
    color: #6c757d;
}

.form-footer a {
    color: #3498db;
    text-decoration: none;
    font-weight: 500;
}

.form-footer a:hover {
    text-decoration: underline;
}
```

---

## Conceitos novos deste CSS

### `display: block` no `<label>`

```css
.form-group label {
    display: block;
    ...
}
```

Por padrão, `<label>` é `inline` — fica na mesma linha que o input seguinte. `display: block` faz o label ocupar a linha inteira, empurrando o input para a linha de baixo. Resultado: label em cima, input embaixo — o layout padrão de formulários.

### O atributo `for` no `<label>` e `id` no `<input>`

Nos HTMLs que escreveremos, usaremos:

```html
<label for="email">Email</label>
<input type="text" id="email" name="email">
```

**`for="email"`** — vincula o label ao input com `id="email"`. Isso traz dois benefícios:
1. **Usabilidade:** clicar no label foca o input (área clicável maior)
2. **Acessibilidade:** leitores de tela associam o label ao input corretamente

`name` continua sendo o que vai para `req.body`. `id` é apenas para vincular ao label via CSS/JS.

### Seletor com vírgula

```css
.form-group input,
.form-group select {
    width: 100%;
    ...
}
```

A vírgula no seletor significa "aplica estas regras a qualquer seletor desta lista". Sem ela, seria necessário repetir o bloco inteiro para `input` e depois para `select`. É o princípio DRY (Don't Repeat Yourself) no CSS.

### `.form-card.wide` — combinação de classes

```css
.form-card.wide {
    max-width: 680px;
}
```

`.form-card.wide` (sem espaço) seleciona elementos que têm **ambas** as classes ao mesmo tempo: `class="form-card wide"`. É mais específico que `.form-card` sozinho, então sobrescreve o `max-width: 480px` com `max-width: 680px`.

No HTML:
```html
<div class="form-card">       → max-width: 480px
<div class="form-card wide">  → max-width: 680px
```

O formulário de usuário tem muitos campos e fica mais confortável com 680px.

### `.form-row .form-group { flex: 1 }`

```css
.form-row {
    display: flex;
    gap: 16px;
}

.form-row .form-group {
    flex: 1;
}
```

`.form-row .form-group` (com espaço) é um **seletor descendente**: afeta `.form-group` que estão **dentro** de `.form-row`. Cada grupo dentro de uma row recebe `flex: 1`, dividindo o espaço igualmente entre eles. Com dois campos em uma row, cada um ocupa 50%.

```
┌─────────────────────────────────────┐
│  Cidade (flex: 1)  │  Estado (flex:1)│
└─────────────────────────────────────┘
```

### O problema dos radio buttons

```css
.form-group input,
.form-group select {
    width: 100%;    /* afeta todos os inputs, incluindo radio */
}

.radio-option input[type="radio"] {
    width: auto;    /* sobrescreve width:100% para radios */
}
```

O seletor `.form-group input` afeta **todos** os `<input>` dentro de `.form-group`, incluindo os do tipo `radio`. Isso causaria um problema: `width: 100%` faria o input radio ocupar toda a linha.

A solução é sobrescrever com um seletor mais específico. O seletor de atributo `[type="radio"]` somado ao seletor de classe dá mais especificidade que `.form-group input`, fazendo `width: auto` vencer o conflito.

**Especificidade em CSS:** quando dois seletores afetam o mesmo elemento e mesma propriedade, o mais específico vence. Seletores de atributo (`[type="radio"]`) têm mais especificidade que seletores de elemento (`input`). Uma forma simples de lembrar: quanto mais precisa a descrição, maior a especificidade.

### `accent-color`

```css
.radio-option input[type="radio"] {
    accent-color: #3498db;
}
```

`accent-color` é uma propriedade CSS relativamente nova que muda a cor de destaque de inputs nativos como `<input type="radio">`, `<input type="checkbox">` e `<input type="range">`. Antes dela, era necessário truques complexos de CSS para mudar a cor de um radio button.

### `text-decoration: underline` no `:hover` do link

```css
.form-footer a {
    text-decoration: none;
}

.form-footer a:hover {
    text-decoration: underline;
}
```

O padrão inverso do que fizemos na sidebar. Para links no footer do formulário, queremos remover o sublinhado por padrão (visual mais limpo) e mostrá-lo apenas no hover (feedback de que é clicável).

---

## Atualizando `public/index.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeuCRUD — Entrar</title>
    <link rel="stylesheet" href="/css/forms.css">
</head>
<body>

    <div class="form-page">
        <div class="form-card">

            <h1 class="form-title">MeuCRUD</h1>
            <p class="form-subtitle">Entre com suas credenciais para acessar o painel.</p>

            <div class="form-group">
                <label for="usuario">Usuário</label>
                <input type="text" id="usuario" placeholder="admin">
            </div>

            <div class="form-group">
                <label for="senha">Senha</label>
                <input type="password" id="senha" placeholder="••••••">
            </div>

            <button id="btn-entrar" class="btn-submit">Entrar</button>

            <div class="form-footer">
                <a href="/formulario.html">Criar conta</a>
            </div>

        </div>
    </div>

    <script>
        document.getElementById('btn-entrar').addEventListener('click', () => {
            const usuario = document.getElementById('usuario').value
            const senha = document.getElementById('senha').value
            if (usuario === 'admin' && senha === 'admin') {
                window.location.href = '/adm'
            } else {
                alert('Usuário ou senha inválidos.')
            }
        })
    </script>

</body>
</html>
```

O JavaScript de validação do login permanece idêntico — apenas adicionamos as classes CSS e a tag `<link>`.

---

## Atualizando `public/formulario.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeuCRUD — Novo Usuário</title>
    <link rel="stylesheet" href="/css/forms.css">
</head>
<body>

    <div class="form-page">
        <div class="form-card wide">

            <h1 class="form-title">Novo Usuário</h1>
            <p class="form-subtitle">Preencha os dados para cadastrar um novo usuário.</p>

            <form action="/usuarios" method="POST">

                <p class="form-section">Dados pessoais</p>

                <div class="form-row">
                    <div class="form-group">
                        <label for="nome">Nome completo</label>
                        <input type="text" id="nome" name="nome" required placeholder="João da Silva">
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required placeholder="joao@email.com">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="senha">Senha</label>
                        <input type="password" id="senha" name="senha" required>
                    </div>
                    <div class="form-group">
                        <label for="telefone">Telefone</label>
                        <input type="tel" id="telefone" name="telefone" placeholder="(45) 99999-9999">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="data_nascimento">Data de nascimento</label>
                        <input type="date" id="data_nascimento" name="data_nascimento">
                    </div>
                    <div class="form-group">
                        <label>Gênero</label>
                        <div class="radio-group">
                            <label class="radio-option">
                                <input type="radio" name="genero" value="feminino">
                                Feminino
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="genero" value="masculino">
                                Masculino
                            </label>
                            <label class="radio-option">
                                <input type="radio" name="genero" value="outro">
                                Outro
                            </label>
                        </div>
                    </div>
                </div>

                <p class="form-section">Endereço</p>

                <div class="form-group">
                    <label for="endereco">Endereço</label>
                    <input type="text" id="endereco" name="endereco" placeholder="Rua das Flores, 123">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="cidade">Cidade</label>
                        <input type="text" id="cidade" name="cidade">
                    </div>
                    <div class="form-group">
                        <label for="estado">Estado</label>
                        <select id="estado" name="estado">
                            <option value="">Selecione</option>
                            <option value="AC">Acre</option>
                            <option value="AL">Alagoas</option>
                            <option value="AP">Amapá</option>
                            <option value="AM">Amazonas</option>
                            <option value="BA">Bahia</option>
                            <option value="CE">Ceará</option>
                            <option value="DF">Distrito Federal</option>
                            <option value="ES">Espírito Santo</option>
                            <option value="GO">Goiás</option>
                            <option value="MA">Maranhão</option>
                            <option value="MT">Mato Grosso</option>
                            <option value="MS">Mato Grosso do Sul</option>
                            <option value="MG">Minas Gerais</option>
                            <option value="PA">Pará</option>
                            <option value="PB">Paraíba</option>
                            <option value="PR">Paraná</option>
                            <option value="PE">Pernambuco</option>
                            <option value="PI">Piauí</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="RN">Rio Grande do Norte</option>
                            <option value="RS">Rio Grande do Sul</option>
                            <option value="RO">Rondônia</option>
                            <option value="RR">Roraima</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="SP">São Paulo</option>
                            <option value="SE">Sergipe</option>
                            <option value="TO">Tocantins</option>
                        </select>
                    </div>
                </div>

                <button type="submit" class="btn-submit">Cadastrar</button>

            </form>

            <div class="form-footer">
                <a href="/adm">Voltar ao painel</a>
            </div>

        </div>
    </div>

</body>
</html>
```

### A técnica do `<label>` envolvendo o radio

No formulário de cadastro, usamos uma abordagem diferente para radio buttons:

```html
<label class="radio-option">
    <input type="radio" name="genero" value="feminino">
    Feminino
</label>
```

Quando o `<label>` **envolve** o input (em vez de usar `for`/`id`), o vínculo é criado implicitamente — clicar em qualquer parte do label (incluindo o texto "Feminino") seleciona o radio. Isso aumenta a área clicável e melhora a usabilidade.

---

## Atualizando `public/produto.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MeuCRUD — Novo Produto</title>
    <link rel="stylesheet" href="/css/forms.css">
</head>
<body>

    <div class="form-page">
        <div class="form-card">

            <h1 class="form-title">Novo Produto</h1>
            <p class="form-subtitle">Preencha os dados para cadastrar um novo produto.</p>

            <form action="/produtos" method="POST">

                <div class="form-group">
                    <label for="nome">Nome do produto</label>
                    <input type="text" id="nome" name="nome" required placeholder="Notebook Dell">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="preco">Preço (R$)</label>
                        <input type="number" id="preco" name="preco" step="0.01" min="0" required placeholder="0,00">
                    </div>
                    <div class="form-group">
                        <label for="quantidade">Quantidade</label>
                        <input type="number" id="quantidade" name="quantidade" min="0" required placeholder="0">
                    </div>
                </div>

                <div class="form-group">
                    <label for="categoria">Categoria</label>
                    <input type="text" id="categoria" name="categoria" placeholder="Eletrônicos">
                </div>

                <button type="submit" class="btn-submit">Cadastrar</button>

            </form>

            <div class="form-footer">
                <a href="/adm">Voltar ao painel</a>
            </div>

        </div>
    </div>

</body>
</html>
```

---

## Testando as páginas estilizadas

Reinicie o servidor e teste cada página:

**`http://localhost:8000/`** — a tela de login deve aparecer centralizada com um card branco, campos estilizados e botão escuro.

**`http://localhost:8000/formulario.html`** — o formulário deve aparecer em um card mais largo, com campos organizados em pares (nome + email, senha + telefone), seções "Dados pessoais" e "Endereço", e os radio buttons alinhados horizontalmente.

**`http://localhost:8000/produto.html`** — card compacto com os campos de preço e quantidade lado a lado.

**Teste de foco:** clique em qualquer campo — a borda deve mudar para azul com um halo suave.

**Teste do label:** clique no texto "Feminino" — o radio button deve ser selecionado (graças ao `<label>` envolvendo o input).

---

## Recapitulação

### O que aprendemos

- Por que dois arquivos CSS separados: layouts estruturalmente diferentes (sidebar vs. card centrado) conflitariam num arquivo único
- O padrão de centralização vertical + horizontal: `min-height: 100vh` + `display: flex` + `align-items: center` + `justify-content: center`
- O padrão `width: 100%` + `max-width`: fluido em telas pequenas, limitado em telas grandes
- `.form-card.wide` — seletor de múltiplas classes (sem espaço) para aplicar variação ao componente base
- `display: block` no `<label>` para empilhar label e input verticalmente
- Os atributos `for` + `id` para vincular label ao input: aumenta a área clicável e melhora a acessibilidade
- Seletor com vírgula `.form-group input, .form-group select` — aplica as mesmas regras a múltiplos seletores (DRY)
- `.form-row .form-group { flex: 1 }` — seletor descendente + `flex: 1` para dois campos de largura igual na mesma linha
- O problema de `width: 100%` em radio buttons e como `width: auto` + seletor mais específico o resolve
- Especificidade CSS: seletores mais precisos vencem quando há conflito na mesma propriedade
- `accent-color` para colorir radio buttons e checkboxes nativos
- `<label>` envolvendo o `<input>` como alternativa ao par `for`/`id` — cria vínculo implícito e aumenta área clicável
- `text-decoration: none` por padrão + `underline` no `:hover` — o padrão inverso do que fizemos na sidebar

### O que fizemos no projeto

**Arquivos criados nesta aula:**

| Arquivo | O que contém |
|---------|--------------|
| `public/css/forms.css` | Layout centrado, card, form-group, form-row, radio-group, btn-submit, form-footer |

**Arquivos modificados nesta aula:**

| Arquivo | O que mudou |
|---------|-------------|
| `public/index.html` | Adicionado `<link>` ao `forms.css`; classes CSS em todos os elementos; estrutura `.form-page` → `.form-card` |
| `public/formulario.html` | Adicionado `<link>`; classes CSS; `.form-section` separando seções; `.form-row` em pares de campos; `<label>` envolvendo radios |
| `public/produto.html` | Adicionado `<link>`; classes CSS; `.form-row` para preço + quantidade |

**As três páginas públicas agora têm:**
- Card centralizado branco com sombra sutil
- Campos estilizados com borda, foco em azul e transição suave
- Layout responsivo (se adapta a telas menores)
- Botão de envio com largura total
- Links de rodapé para navegação

---

## Na próxima aula

Na **Aula 12** — a última — vamos adicionar validação de formulários com JavaScript do lado do cliente:
- O que é validação client-side e por que ela complementa (mas não substitui) a validação server-side
- `addEventListener('submit', ...)` e `event.preventDefault()` para interceptar o envio
- Verificar campos obrigatórios, formato de email e comprimento mínimo de senha antes de enviar
- Exibir mensagens de erro próximas aos campos com `classList.add` e `classList.remove`
- A diferença entre validação no browser (imediata, melhor UX) e validação no servidor (necessária, confiável)
