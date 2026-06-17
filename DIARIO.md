# Diário de Desenvolvimento — MeuCRUD

**Projeto:** Sistema CRUD simples para estudo de desenvolvimento web  
**Tecnologias:** HTML · CSS · JavaScript · Node.js · Express · MySQL · MVC · Git · GitHub  

---

## Objetivo

Construir uma aplicação web tradicional (sem frameworks frontend) que permitisse ao administrador gerenciar usuários e produtos por meio de um painel simples. O projeto serviu como laboratório prático para aprender as responsabilidades de cada camada do modelo MVC e como elas se comunicam entre si.

---

## Análise inicial do projeto

Antes de escrever qualquer código novo, foi feita uma leitura completa de todos os arquivos existentes. Essa etapa revelou o estado real do projeto e evitou retrabalho.

### O que já existia

O projeto tinha uma estrutura MVC parcialmente formada:

- **`config/database.js`** — conexão com o MySQL usando a biblioteca `mysql2`, apontando para o banco `meuCrud` na porta `3306`. Funcionava corretamente.
- **`models/usuarioModel.js`** — continha apenas duas das seis funções necessárias: `criarUsuario` e `listarUsuarios`.
- **`models/produtoModel.js`** — continha apenas `listarProdutos`. Todo o restante do CRUD estava ausente.
- **`controllers/admController.js`** — gerava o painel administrativo com HTML dinâmico, buscando dados reais do banco.
- **`routes/admRoutes.js`** — mapeava corretamente `GET /adm` para o controller do painel.
- **`routes/usuariosRoutes.js`** — declarava as quatro rotas REST (GET, POST, PUT, DELETE), mas as rotas apontavam para um controller que não fazia nada.
- **`index.js`** — servidor Express configurado com middlewares e arquivos estáticos.
- **`public/css/style.css`** — CSS funcional para o painel ADM com sidebar, tabelas e botões.
- **`public/formulario.html`** — formulário completo de cadastro de usuário, sem CSS aplicado.

### Problemas encontrados

**1. Controller de usuário era um stub completo**  
Todas as quatro funções em `controllers/usuarioController.js` retornavam apenas uma string de texto, sem qualquer chamada ao model ou ao banco de dados. O formulário de cadastro submetia os dados, mas eles nunca eram salvos.

**2. Dois painéis administrativos conflitantes**  
Existiam simultaneamente `public/adm.html` (arquivo estático com dados fictícios hardcoded) e a rota `GET /adm` (que buscava dados reais do banco). O arquivo estático era um rascunho abandonado que causava confusão sobre qual era o painel real.

**3. Rotas incompatíveis com formulários HTML**  
As rotas de editar e deletar no `usuariosRoutes.js` usavam os métodos HTTP `PUT` e `DELETE`. O problema é que formulários HTML (`<form>`) suportam apenas `GET` e `POST`. Os botões de editar e excluir no painel gerariam erros ao serem clicados.

**4. Controller e rotas de produtos inexistentes**  
Não havia `controllers/produtoController.js` nem `routes/produtosRoutes.js`. O CRUD de produtos estava presente apenas no model de forma incompleta.

**5. Arquivo `public/js/database.js` vazio e incorreto**  
Um arquivo chamado `database.js` dentro da pasta `public/js/` (que é servida para o navegador) não faz sentido — o frontend nunca deve acessar o banco de dados diretamente. O arquivo estava vazio e havia sido criado por engano.

**6. Pesquisa por nome não existia em nenhuma camada**  
Não havia rota, controller nem função de model para buscar usuários ou produtos por nome.

---

## Etapa 1 — Limpeza e reorganização

**O que foi feito:**
- Removido `public/adm.html` — substituído definitivamente pela rota dinâmica `GET /adm`
- Removido `public/js/database.js` — arquivo vazio e semanticamente incorreto
- Removido `public/usuario.html` — arquivo completamente vazio sem propósito definido

**Por que foi importante fazer isso primeiro:**  
Trabalhar com arquivos mortos no projeto cria confusão. O `adm.html` estático poderia levar alguém a editar o arquivo HTML pensando que estava modificando o painel real, quando na verdade o painel vem do controller. Limpar antes de construir evita esse tipo de erro.

**O que aprendemos:**  
Arquivos estáticos servidos pelo Express (`public/`) e páginas geradas dinamicamente por controllers são coisas distintas. Um arquivo `adm.html` em `public/` é servido diretamente pelo servidor sem passar por nenhum controller. Para uma página com dados do banco, a rota deve passar por um controller que monta o HTML.

---

## Etapa 2 — CRUD completo de usuários

**O que foi feito:**

### Model (`models/usuarioModel.js`)
Adicionadas quatro funções que estavam faltando:

- `buscarUsuarioPorId(id, callback)` — usada para pré-preencher o formulário de edição
- `buscarUsuarioPorNome(nome, callback)` — usa `LIKE %nome%` para busca parcial
- `atualizarUsuario(id, dados, callback)` — executa `UPDATE` com todos os campos exceto senha
- `deletarUsuario(id, callback)` — executa `DELETE WHERE id = ?`

### Controller (`controllers/usuarioController.js`)
Reescrito do zero com quatro funções reais:

- `criarUsuario` — lê `req.body`, chama o model, redireciona para `/adm`
- `mostrarFormularioEdicao` — busca o usuário por ID, gera HTML com os valores pré-preenchidos nos inputs
- `atualizarUsuario` — salva as alterações no banco, redireciona para `/adm`
- `deletarUsuario` — exclui o registro, redireciona para `/adm`

### Rotas (`routes/usuariosRoutes.js`)
Substituídas as rotas `PUT` e `DELETE` por rotas `POST` compatíveis com formulários HTML:

```
POST /usuarios/             → criar usuário
GET  /usuarios/:id/editar   → exibir formulário de edição preenchido
POST /usuarios/:id/editar   → salvar edição
POST /usuarios/:id/deletar  → excluir usuário
```

**Decisão técnica — por que não usar PUT e DELETE?**  
O HTTP define métodos como PUT, PATCH e DELETE para operações de atualização e remoção. APIs REST modernas usam esses métodos. Porém, o elemento `<form>` do HTML só suporta `GET` e `POST`. Como este projeto não usa JavaScript para fazer requisições (projeto tradicional, sem fetch/axios), todas as interações do painel precisam usar formulários HTML — logo, apenas POST.

**O que aprendemos:**  
O fluxo completo de uma operação CRUD tradicional:  
`HTML form` → `POST /rota` → `Express router` → `Controller` → `Model` → `MySQL` → `res.redirect()`

O redirect ao final é essencial. Sem ele, dar F5 após um cadastro repetiria a submissão do formulário, cadastrando o mesmo registro duas vezes.

---

## Etapa 3 — CRUD completo de produtos

**O que foi feito:**

### Model (`models/produtoModel.js`)
Completado com todas as funções necessárias:
- `criarProduto`, `buscarProdutoPorId`, `buscarProdutoPorNome`, `atualizarProduto`, `deletarProduto`

### Controller (`controllers/produtoController.js`)
Criado do zero seguindo exatamente o mesmo padrão do controller de usuários. Os campos do produto são mais simples (nome, preço, quantidade, categoria), então o formulário de edição gerado pelo controller também é mais enxuto.

### Rotas (`routes/produtosRoutes.js`)
Criado com a mesma estrutura das rotas de usuários:
```
POST /produtos/             → criar produto
GET  /produtos/:id/editar   → exibir formulário de edição
POST /produtos/:id/editar   → salvar edição
POST /produtos/:id/deletar  → excluir produto
```

### `index.js`
As rotas de produtos foram registradas no servidor:
```js
app.use('/produtos', produtoRoutes)
```

### `public/produto.html`
Criado o formulário de cadastro de produto com os quatro campos e action apontando para `POST /produtos`.

**O que aprendemos:**  
A importância de seguir um padrão consistente entre entidades. Como o CRUD de usuários foi bem estruturado na Etapa 2, replicar o padrão para produtos foi rápido e sem erros. MVC facilita a escala do projeto — adicionar uma nova entidade significa criar um model, um controller e um arquivo de rotas seguindo o mesmo formato.

---

## Etapa 4 — Painel administrativo profissional

**O que foi feito:**

O `admController.js` foi reescrito completamente para entregar um painel mais funcional e organizado.

### Pesquisa por nome
O painel passou a aceitar parâmetros de busca via query string:
- `GET /adm?busca_usuario=João` → filtra a tabela de usuários
- `GET /adm?busca_produto=Camiseta` → filtra a tabela de produtos

O controller verifica se o parâmetro de busca está presente e chama a função correta do model:

```js
const obterUsuarios = buscaUsuario
    ? (cb) => usuarioModel.buscarUsuarioPorNome(buscaUsuario, cb)
    : usuarioModel.listarUsuarios
```

### Dashboard com cards
Quando o painel é acessado sem filtros, são exibidos cards com o total de usuários e produtos cadastrados. Ao pesquisar, os cards somem e aparece a contagem de resultados encontrados.

### Estado vazio
Quando nenhum resultado é encontrado, o painel exibe uma mensagem em vez de uma tabela vazia, o que é mais claro para o usuário.

### Confirmação antes de excluir
Os botões de excluir passaram a exibir uma caixa de confirmação nativa do browser:
```html
onclick="return confirm('Excluir João da Silva?')"
```
Se o usuário clicar em "Cancelar", o formulário não é submetido e nada é excluído.

### Estrutura do HTML reorganizada
O HTML passou a ser construído em variáveis separadas antes de ser montado no template final, tornando o código muito mais legível:

```js
const linhasUsuarios = usuarios.map(u => `<tr>...</tr>`).join('')
const tabelaUsuarios = usuarios.length === 0 ? '<p>Vazio</p>' : `<table>...</table>`
const html = `<!DOCTYPE html>... ${tabelaUsuarios} ...`
```

**O que aprendemos:**  
A diferença entre rota e arquivo estático fica evidente aqui: o painel só consegue ter dados dinâmicos porque passa por um controller. Query strings (`?chave=valor`) são uma forma simples e nativa do HTTP de passar parâmetros para o servidor sem precisar de formulários POST.

---

## Etapa 5 — Páginas públicas

**O que foi feito:**

### Novo arquivo `public/css/forms.css`
Criado um CSS separado do `style.css` para as páginas públicas (login, formulários). A separação foi necessária porque o painel ADM usa um layout com sidebar fixa e as páginas públicas usam um layout centralizado — compartilhar o mesmo CSS causaria conflito.

Destaques do `forms.css`:
- `.login-body` — centraliza o card de login verticalmente na tela
- `.form-group` — agrupa label + input com espaçamento consistente
- `.radio-group` — radio buttons com labels clicáveis envolvendo o input
- `.form-error` — bloco de erro oculto por padrão, que aparece via JavaScript

### Login (`public/index.html`)
Redesenhado com layout centrado e lógica de validação em JavaScript:

```js
function fazerLogin(evento) {
    evento.preventDefault()
    const usuario = document.getElementById('usuario').value.trim()
    const senha = document.getElementById('senha').value

    if (!usuario || !senha) {
        erro.textContent = 'Preencha o usuário e a senha.'
        erro.classList.add('visible')
        return
    }

    if (usuario === 'admin' && senha === 'admin') {
        window.location.href = '/adm'
    } else {
        erro.textContent = 'Usuário ou senha inválidos.'
        erro.classList.add('visible')
    }
}
```

Conceitos de JavaScript presentes nessa função:
- `evento.preventDefault()` — impede que o formulário recarregue a página
- `value.trim()` — remove espaços em branco antes e depois do texto
- `classList.add('visible')` — adiciona uma classe CSS para exibir o erro
- `window.location.href` — redireciona o usuário para outra página

### Formulário de usuário (`public/formulario.html`)
Completamente reformulado com classes CSS, placeholders descritivos e radio buttons com labels clicáveis. A estrutura com `.form-group` torna cada campo visualmente consistente.

### Formulário de produto (`public/produto.html`)
Reformulado seguindo o mesmo padrão visual do formulário de usuário.

**O que aprendemos:**  
A separação de responsabilidades se aplica também ao CSS. Um arquivo de estilos não precisa servir todas as páginas — criar arquivos específicos por contexto (painel vs. páginas públicas) mantém os estilos organizados e evita sobreposições não intencionais.

---

## Estrutura final do projeto

```
meuCRUD/
│
├── index.js                     ← Servidor Express, registra todas as rotas
│
├── config/
│   └── database.js              ← Conexão com o MySQL
│
├── models/
│   ├── usuarioModel.js          ← criarUsuario, listarUsuarios, buscarPorId,
│   │                               buscarPorNome, atualizarUsuario, deletarUsuario
│   └── produtoModel.js          ← criarProduto, listarProdutos, buscarPorId,
│                                   buscarPorNome, atualizarProduto, deletarProduto
│
├── controllers/
│   ├── usuarioController.js     ← criar, mostrarFormularioEdicao, atualizar, deletar
│   ├── produtoController.js     ← criar, mostrarFormularioEdicao, atualizar, deletar
│   └── admController.js         ← painel com dashboard, tabelas e pesquisa
│
├── routes/
│   ├── usuariosRoutes.js        ← POST /, GET /:id/editar, POST /:id/editar, POST /:id/deletar
│   ├── produtosRoutes.js        ← POST /, GET /:id/editar, POST /:id/editar, POST /:id/deletar
│   └── admRoutes.js             ← GET /
│
└── public/
    ├── index.html               ← Login com validação JavaScript
    ├── formulario.html          ← Cadastro de usuário
    ├── produto.html             ← Cadastro de produto
    └── css/
        ├── style.css            ← Estilos do painel ADM
        └── forms.css            ← Estilos das páginas públicas
```

---

## Mapa de rotas

| Método | Rota                     | Ação                                      |
|--------|--------------------------|-------------------------------------------|
| GET    | `/`                      | Serve a página de login (`index.html`)    |
| GET    | `/adm`                   | Exibe o painel com dados do banco         |
| GET    | `/adm?busca_usuario=X`   | Painel com tabela de usuários filtrada    |
| GET    | `/adm?busca_produto=X`   | Painel com tabela de produtos filtrada    |
| POST   | `/usuarios`              | Cadastra um novo usuário                  |
| GET    | `/usuarios/:id/editar`   | Exibe formulário preenchido para edição   |
| POST   | `/usuarios/:id/editar`   | Salva as alterações do usuário            |
| POST   | `/usuarios/:id/deletar`  | Exclui o usuário                          |
| POST   | `/produtos`              | Cadastra um novo produto                  |
| GET    | `/produtos/:id/editar`   | Exibe formulário preenchido para edição   |
| POST   | `/produtos/:id/editar`   | Salva as alterações do produto            |
| POST   | `/produtos/:id/deletar`  | Exclui o produto                          |

---

## Fluxo completo de uma operação

O caminho que cada ação percorre, da interface ao banco de dados e de volta:

```
Usuário clica em "Excluir"
        ↓
<form action="/usuarios/5/deletar" method="POST">
        ↓
Express recebe POST /usuarios/5/deletar
        ↓
usuariosRoutes.js → router.post('/:id/deletar', ...)
        ↓
usuarioController.js → deletarUsuario(req, res)
        ↓
usuarioModel.js → DELETE FROM usuarios WHERE id = 5
        ↓
MySQL executa a query
        ↓
Controller recebe o callback sem erro
        ↓
res.redirect('/adm')
        ↓
Navegador carrega o painel atualizado
```

---

## Decisões técnicas registradas

**Por que não usar PUT e DELETE nas rotas?**  
O HTML nativo suporta apenas os métodos GET e POST em formulários. Como o projeto não utiliza JavaScript para fazer requisições assíncronas (sem `fetch` ou `XMLHttpRequest`), toda a comunicação com o servidor ocorre via formulários. Por isso, as operações de atualização e exclusão usam POST com URLs descritivas (`/editar`, `/deletar`).

**Por que o painel ADM gera HTML no controller em vez de servir um arquivo `.html`?**  
Para exibir dados do banco de dados em uma página HTML sem usar um motor de templates (como EJS ou Handlebars), é preciso montar o HTML dinamicamente no servidor. O controller lê os dados, constrói a string HTML com os valores interpolados e envia com `res.send()`. Essa abordagem é direta e não adiciona dependências ao projeto.

**Por que separar `style.css` e `forms.css`?**  
O `style.css` define um layout com sidebar fixa e área de conteúdo deslocada. As páginas públicas precisam de um layout diferente (card centralizado). Mesclar os dois em um único arquivo causaria conflitos no `body` e exigiria sobreposições com alta especificidade. Manter arquivos separados por contexto é mais limpo e mais fácil de manter.

**Por que a busca usa query string (`?busca_usuario=X`) e não um POST?**  
Buscas e filtros são operações de leitura — elas não alteram dados. O método GET é semanticamente correto para esse caso. Além disso, a query string permite que o resultado seja salvo nos favoritos ou compartilhado por link, o que não seria possível com POST.
