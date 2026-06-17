# Checkpoint — Revisão Geral e Mapa dos Próximos Passos

## O que é esta aula

Esta não é uma aula de implementação. É uma parada estratégica para:
- Revisar o que foi construído nas Aulas 1 a 12
- Enxergar o projeto como um sistema completo
- Identificar o que ainda falta para ser um sistema real
- Entender o que vem nas próximas aulas e por quê

---

## O projeto até aqui

### Estrutura de arquivos

```
meuCRUD/
├── index.js                          ← ponto de entrada do servidor
├── config/
│   └── database.js                   ← conexão com o MySQL
├── models/
│   ├── usuarioModel.js               ← SQL de usuários (6 funções)
│   └── produtoModel.js               ← SQL de produtos (6 funções)
├── controllers/
│   ├── usuarioController.js          ← 4 funções (criar, editar, atualizar, deletar)
│   ├── produtoController.js          ← 4 funções (criar, editar, atualizar, deletar)
│   └── admController.js             ← 1 função (painel com busca)
├── routes/
│   ├── usuariosRoutes.js             ← 4 rotas
│   ├── produtosRoutes.js             ← 4 rotas
│   └── admRoutes.js                  ← 1 rota
└── public/
    ├── index.html                    ← tela de login
    ├── formulario.html               ← cadastro de usuário
    ├── produto.html                  ← cadastro de produto
    └── css/
        ├── style.css                 ← estilos do painel ADM
        └── forms.css                 ← estilos dos formulários
```

### Funcionalidades implementadas

| Funcionalidade | Rota | Status |
|---------------|------|--------|
| Tela de login | `GET /` | ✓ |
| Cadastrar usuário | `POST /usuarios` | ✓ |
| Editar usuário | `GET + POST /usuarios/:id/editar` | ✓ |
| Excluir usuário | `POST /usuarios/:id/deletar` | ✓ |
| Cadastrar produto | `POST /produtos` | ✓ |
| Editar produto | `GET + POST /produtos/:id/editar` | ✓ |
| Excluir produto | `POST /produtos/:id/deletar` | ✓ |
| Painel ADM com listagem | `GET /adm` | ✓ |
| Busca de usuários | `GET /adm?busca_usuario=termo` | ✓ |
| Busca de produtos | `GET /adm?busca_produto=termo` | ✓ |

---

## A stack tecnológica — papel de cada peça

```
Browser
    ↕  HTTP (GET, POST)
Express.js       ← framework web — recebe requisições, define rotas
    ↕
Controller       ← coordena: lê req, chama model, envia res
    ↕
Model            ← executa SQL e retorna resultado
    ↕
mysql2           ← driver — faz a ponte Node.js ↔ MySQL
    ↕
MySQL            ← banco de dados — armazena e consulta os dados
```

Cada tecnologia tem uma responsabilidade clara e não invade a do vizinho. Isso é o **MVC em prática**.

---

## Conceitos trabalhados nas Aulas 1 a 12

### Node.js e módulos
- Runtime JavaScript fora do browser
- `require()` para importar, `module.exports` para exportar
- Pacotes do npm (`express`, `mysql2`) instalados com `npm install`
- O arquivo `package.json` como manifesto do projeto

### Express.js
- `app.listen()` — inicializa o servidor
- `app.use()` — registra middlewares e routers
- `express.urlencoded()` — parseia corpos de formulários HTML
- `express.static()` — serve arquivos da pasta `public/`
- `express.Router()` — mini-roteador para organizar rotas por entidade
- `req.body`, `req.params`, `req.query` — três formas de dados chegarem
- `res.send()`, `res.sendFile()`, `res.redirect()`, `res.json()` — formas de responder

### HTTP
- Métodos GET (leitura) e POST (escrita)
- Códigos de status: 200 (ok), 302 (redirect), 404 (não encontrado)
- O padrão PRG (Post / Redirect / Get) — por que redirecionar após um POST
- Query string (`?chave=valor`) para filtros e buscas

### MySQL e SQL
- Tipos de dados: `VARCHAR`, `INT`, `DECIMAL`, `DATE`, `TEXT`
- `INSERT INTO ... VALUES (?, ?, ?)`
- `SELECT * FROM ... ORDER BY`
- `SELECT ... WHERE id = ?`
- `SELECT ... WHERE nome LIKE '%termo%'`
- `UPDATE ... SET ... WHERE id = ?`
- `DELETE FROM ... WHERE id = ?`
- Placeholders `?` como proteção contra SQL Injection

### MVC
- **Model** — único responsável pelo SQL; não conhece Express
- **View** — HTML estático ou gerado pelo controller; não conhece o banco
- **Controller** — coordena; conhece `req`/`res` e o model
- **Routes** — mapeiam URLs para funções do controller
- Separação de responsabilidades: cada arquivo faz uma coisa só

### Callbacks e assíncrono
- Funções passadas como argumento para serem chamadas depois
- Padrão error-first: `callback(erro, resultado)`
- Callbacks aninhados para múltiplas consultas sequenciais
- O modelo assíncrono do Node.js: não bloqueia enquanto espera o banco

### HTML
- `<form method="POST" action="/rota">` — submissão de dados
- Atributo `name` dos inputs → chaves em `req.body`
- `<input type="number">`, `step`, `min`, `required`
- Radio buttons com `checked`, select com `selected` (para pré-preenchimento)
- Atributo `for`/`id` para vincular label ao input
- `colspan` para células de tabela que ocupam múltiplas colunas

### CSS
- Seletores: elemento, classe (`.`), pseudo-classe (`:hover`, `:focus`, `:last-child`)
- Flexbox: `display: flex`, `flex: 1`, `flex-shrink: 0`, `justify-content`, `align-items`, `gap`
- `min-height: 100vh`, `max-width`, `width: 100%` — layout responsivo
- `border-collapse: collapse`, `overflow: hidden` + `border-radius` — tabelas estilizadas
- `transition` — animações suaves
- `accent-color` — colorir radio buttons e checkboxes
- Reset universal `* { box-sizing: border-box }`
- Dois arquivos CSS com responsabilidades distintas (`style.css` vs `forms.css`)

### JavaScript no browser
- DOM: `getElementById`, `querySelector`, `querySelectorAll`
- `addEventListener('submit', callback)` + `event.preventDefault()`
- `element.classList.add/remove` — manipular classes CSS em tempo real
- `element.textContent` — ler/escrever texto
- `parseFloat`, `parseInt`, `isNaN` — trabalhar com números de inputs
- Regex `.test()` — validar formato de email
- `window.location.href` — navegar programaticamente

---

## O que o sistema ainda NÃO faz

### 1. Qualquer pessoa acessa o painel
A URL `/adm` está completamente aberta. Qualquer visitante que a conhecer tem acesso total — pode ver, editar e excluir todos os dados.

### 2. O login é uma ilusão
A verificação `admin/admin` roda **no browser**, em JavaScript visível. Basta abrir o DevTools, encontrar a condição e navegar diretamente para `/adm`. O servidor nunca valida quem está tentando entrar.

### 3. As senhas estão em texto puro
Se o banco de dados vazar — por um backup mal guardado, um SQL de debug copiado por engano, um acesso não autorizado — todas as senhas dos usuários ficam expostas diretamente.

### 4. As credenciais do banco estão no código-fonte
`host: 'localhost'`, `user: 'root'`, `password: '123456'` estão escritas no `config/database.js`. Se o repositório for publicado no GitHub por engano, esses dados ficam permanentemente expostos (mesmo que sejam apagados depois — o histórico do git os preserva).

### 5. Não há página pública de produtos
O único acesso aos produtos é o painel ADM, que requer (ou deveria requerer) login. Um e-commerce real precisa de uma vitrine pública onde qualquer visitante veja os produtos.

---

## O que vem nas próximas aulas

### Aula 13 — Variáveis de Ambiente com `dotenv`
**Resolve o problema 4.** Credenciais saem do código e vão para um arquivo `.env` que nunca é commitado. É a primeira coisa a fazer porque as aulas seguintes adicionam mais segredos (como o segredo da sessão).

### Aula 14 — Hash de Senhas com `bcrypt`
**Resolve o problema 3.** O `bcrypt` transforma a senha em um hash irreversível antes de salvar no banco. Mesmo com acesso ao banco, não é possível recuperar a senha original.

### Aula 15 — Sessões HTTP com `express-session`
**Fundação para o problema 2.** Ensina o conceito de sessão: como o servidor mantém estado entre requisições stateless do HTTP. Base obrigatória antes de construir o login real.

### Aula 16 — Login Real: bcrypt + session
**Resolve o problema 2.** O formulário de login passa a enviar para `POST /login` no servidor, que verifica a senha com bcrypt e cria uma sessão. O browser não decide mais quem está logado — o servidor decide.

### Aula 17 — Middleware de Proteção de Rotas
**Resolve o problema 1.** Um middleware verifica, antes de qualquer rota protegida, se existe uma sessão válida. Sem sessão → redireciona para o login. O painel ADM e todas as rotas de edição ficam bloqueadas para visitantes.

### Aula 18 — Vitrine de Produtos
**Resolve o problema 5.** Uma rota pública `GET /loja` exibe os produtos do banco em cards visuais com CSS Grid. Visitantes veem o catálogo sem precisar de login. O header muda conforme o estado da sessão.

### Aula 19 — Carrinho de Compras *(bônus)*
Usa a sessão já instalada para manter um carrinho temporário. O visitante adiciona produtos, o servidor guarda a lista em `req.session.carrinho`, e o total é calculado dinamicamente.

---

## Complexidade de cada tema

### Como ler a tabela

- **Conceitual** — o quanto o tema exige mudar sua forma de pensar (novo paradigma)
- **Prática** — o quanto de código novo será escrito e quantas peças precisam funcionar juntas
- **Risco de erro** — o quanto é fácil errar de um jeito difícil de diagnosticar

| Aula | Tema | Conceitual | Prática | Risco de erro |
|------|------|-----------|---------|--------------|
| 13 | dotenv | Baixa | Baixa | Baixo |
| 14 | bcrypt | Média | Baixa | Médio |
| 15 | express-session | **Alta** | Baixa | Médio |
| 16 | Login real | Média | **Alta** | **Alto** |
| 17 | Middleware | **Alta** | Média | Médio |
| 18 | Vitrine | Baixa | Média | Baixo |
| 19 | Carrinho | Média | **Alta** | **Alto** |

### Por que a Aula 15 tem complexidade conceitual alta

Sessões exigem entender que o HTTP é **stateless por design** — cada requisição é independente, o servidor não tem memória entre elas. Isso vai contra a intuição de "estar logado". Entender cookies, IDs de sessão e onde os dados ficam guardados é conceitualmente novo, mesmo que o código seja simples.

### Por que a Aula 16 tem risco alto

O login integra três peças que ainda não funcionaram juntas: o model de usuários, o bcrypt e a sessão. Um erro em qualquer ponto — buscar pelo campo errado, comparar o hash errado, salvar o objeto errado na sessão — faz tudo parecer quebrado de um jeito que pode ser difícil de diagnosticar.

### Por que a Aula 17 tem complexidade conceitual alta

Middleware é um padrão novo: uma função no meio do caminho que decide se a requisição continua ou é bloqueada. O conceito de `next()` — "passe o controle para a próxima função" — e a ordem de registro dos middlewares no Express são contraintuitivos no começo.

### Por que a Aula 13 é a mais simples

É quase só configuração: instalar um pacote, criar um arquivo, trocar strings por variáveis. Nenhum novo conceito de programação — apenas uma boa prática de organização que todo projeto deve ter.

---

## A ordem importa

As aulas foram organizadas para que cada uma apoie a seguinte:

```
Aula 13 (dotenv)
    → cria SESSION_SECRET no .env
    → usado na Aula 15 (express-session)

Aula 14 (bcrypt)
    → hash gerado no cadastro
    → comparado na Aula 16 (login real)

Aula 15 (express-session)
    → ensina como sessões funcionam
    → base para a Aula 16 (login) e Aula 17 (middleware)

Aula 16 (login real)
    → cria req.session.usuario
    → verificado na Aula 17 (middleware) e na Aula 18 (vitrine)

Aula 17 (middleware)
    → protege as rotas do ADM
    → libera a Aula 18 (vitrine) como rota pública consciente

Aula 18 (vitrine)
    → usa req.session para mostrar estado de login
    → a sessão do Aula 19 (carrinho) é a mesma já instalada
```

Não é possível fazer a Aula 16 antes da 15, nem a 17 antes da 16. Mas a Aula 18 pode ser feita depois da 17 sem depender da 19. A Aula 19 é verdadeiramente opcional.

---

## Uma palavra sobre o que já foi aprendido

Nas 12 aulas anteriores foram cobertos os fundamentos que a maioria dos desenvolvedores web usa no dia a dia:

- Montar um servidor HTTP do zero
- Organizar código em camadas com MVC
- Conectar ao banco de dados e executar SQL com segurança
- Criar e consumir rotas REST-like
- Servir HTML dinâmico gerado no servidor
- Estilizar interfaces com CSS moderno (Flexbox, Grid, pseudo-classes)
- Validar dados no browser antes de enviar

O que vem a seguir não é mais complexo em termos de volume de código — é mais maduro em termos de **segurança e arquitetura**. As próximas aulas transformam um projeto de estudo em algo que se aproxima de um sistema real.

---

## Pronto para continuar?

Quando quiser, podemos começar pela **Aula 13 — Variáveis de Ambiente com `dotenv`**. É a mais rápida e abre caminho para todas as que seguem.
