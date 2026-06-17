const usuarioModel = require('../models/usuarioModel')
const produtoModel = require('../models/produtoModel')

function painelAdm(req, res) {
    const buscaUsuario = req.query.busca_usuario || ''
    const buscaProduto = req.query.busca_produto || ''

    const obterUsuarios = buscaUsuario
        ? (cb) => usuarioModel.buscarUsuarioPorNome(buscaUsuario, cb)
        : usuarioModel.listarUsuarios

    const obterProdutos = buscaProduto
        ? (cb) => produtoModel.buscarProdutoPorNome(buscaProduto, cb)
        : produtoModel.listarProdutos

    obterUsuarios((erroU, usuarios) => {
        if (erroU) {
            console.log(erroU)
            return res.send('Erro ao buscar usuários.')
        }

        obterProdutos((erroP, produtos) => {
            if (erroP) {
                console.log(erroP)
                return res.send('Erro ao buscar produtos.')
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
                        <a class="btn edit" href="/usuarios/${u.id}/editar">Editar</a>
                        <form action="/usuarios/${u.id}/deletar" method="POST" class="inline-form">
                            <button class="btn delete" type="submit" onclick="return confirm('Excluir ${u.nome}?')">Excluir</button>
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
                        <a class="btn edit" href="/produtos/${p.id}/editar">Editar</a>
                        <form action="/produtos/${p.id}/deletar" method="POST" class="inline-form">
                            <button class="btn delete" type="submit" onclick="return confirm('Excluir ${p.nome}?')">Excluir</button>
                        </form>
                    </td>
                </tr>
            `).join('')

            const tabelaUsuarios = usuarios.length === 0
                ? '<p class="empty-state">Nenhum usuário encontrado.</p>'
                : `<table>
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
                        <tbody>${linhasUsuarios}</tbody>
                   </table>`

            const tabelaProdutos = produtos.length === 0
                ? '<p class="empty-state">Nenhum produto encontrado.</p>'
                : `<table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Produto</th>
                                <th>Preço</th>
                                <th>Quantidade</th>
                                <th>Categoria</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>${linhasProdutos}</tbody>
                   </table>`

            const statsHtml = (!buscaUsuario && !buscaProduto) ? `
                <div class="stats">
                    <div class="stat-card">
                        <span class="stat-number">${usuarios.length}</span>
                        <span class="stat-label">Usuários cadastrados</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${produtos.length}</span>
                        <span class="stat-label">Produtos cadastrados</span>
                    </div>
                </div>
            ` : ''

            const infoUsuario = buscaUsuario
                ? `<p class="search-info">${usuarios.length} resultado(s) para "${buscaUsuario}"</p>`
                : ''

            const infoProduto = buscaProduto
                ? `<p class="search-info">${produtos.length} resultado(s) para "${buscaProduto}"</p>`
                : ''

            const html = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Painel ADM — MeuCRUD</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>

                    <aside class="sidebar">
                        <div class="sidebar-logo">MeuCRUD</div>
                        <nav>
                            <span class="nav-label">Geral</span>
                            <a href="/adm">Dashboard</a>

                            <span class="nav-label">Usuários</span>
                            <a href="/adm#usuarios">Listar usuários</a>
                            <a href="/formulario.html">Novo usuário</a>

                            <span class="nav-label">Produtos</span>
                            <a href="/adm#produtos">Listar produtos</a>
                            <a href="/produto.html">Novo produto</a>

                            <a href="/" class="nav-sair">Sair</a>
                        </nav>
                    </aside>

                    <main class="content">
                        <h1>Painel Administrativo</h1>

                        ${statsHtml}

                        <section id="usuarios" class="card">
                            <div class="section-header">
                                <h2>Usuários</h2>
                                <a class="btn primary" href="/formulario.html">+ Novo usuário</a>
                            </div>

                            <form class="search-form" action="/adm" method="GET">
                                <input type="text" name="busca_usuario" placeholder="Buscar por nome..." value="${buscaUsuario}">
                                <button class="btn primary" type="submit">Buscar</button>
                                ${buscaUsuario ? '<a class="btn secondary" href="/adm#usuarios">Limpar</a>' : ''}
                            </form>

                            ${infoUsuario}
                            ${tabelaUsuarios}
                        </section>

                        <section id="produtos" class="card">
                            <div class="section-header">
                                <h2>Produtos</h2>
                                <a class="btn primary" href="/produto.html">+ Novo produto</a>
                            </div>

                            <form class="search-form" action="/adm" method="GET">
                                <input type="text" name="busca_produto" placeholder="Buscar por nome..." value="${buscaProduto}">
                                <button class="btn primary" type="submit">Buscar</button>
                                ${buscaProduto ? '<a class="btn secondary" href="/adm#produtos">Limpar</a>' : ''}
                            </form>

                            ${infoProduto}
                            ${tabelaProdutos}
                        </section>
                    </main>

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
