const usuarioModel = require('../models/usuarioModel')
const produtoModel = require('../models/produtoModel')

function painelAdm(req, res) {
    usuarioModel.listarUsuarios((erroUsuarios, usuarios) => {
        if (erroUsuarios) {
            console.log(erroUsuarios)
            return res.send('Erro ao buscar usuários.')
        }

        produtoModel.listarProdutos((erroProdutos, produtos) => {
            if (erroProdutos) {
                console.log(erroProdutos)
                return res.send('Erro ao buscar produtos.')
            }

            let html = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Painel ADM</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>

                    <aside class="sidebar">
                        <h2>MeuCRUD</h2>

                        <nav>
                            <a href="#usuarios">Usuários</a>
                            <a href="#produtos">Produtos</a>
                            <a href="/formulario.html">Criar usuário</a>
                            <a href="/criar-produto.html">Criar produto</a>
                            <a href="/">Sair</a>
                        </nav>
                    </aside>

                    <main class="content">
                        <h1>Painel Administrativo</h1>

                        <section id="usuarios" class="card">
                            <div class="section-header">
                                <h2>Usuários cadastrados</h2>
                                <a class="btn primary" href="/formulario.html">Novo usuário</a>
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
            `

            usuarios.forEach(usuario => {
                html += `
                    <tr>
                        <td>${usuario.id}</td>
                        <td>${usuario.nome}</td>
                        <td>${usuario.email}</td>
                        <td>${usuario.telefone || ''}</td>
                        <td>${usuario.cidade || ''}</td>
                        <td>${usuario.estado || ''}</td>
                        <td>
                            <a class="btn edit" href="/usuarios/${usuario.id}/editar">Editar</a>

                            <form action="/usuarios/${usuario.id}/deletar" method="POST" class="inline-form">
                                <button class="btn delete" type="submit">Excluir</button>
                            </form>
                        </td>
                    </tr>
                `
            })

            html += `
                                </tbody>
                            </table>
                        </section>

                        <section id="produtos" class="card">
                            <div class="section-header">
                                <h2>Produtos cadastrados</h2>
                                <a class="btn primary" href="/criar-produto.html">Novo produto</a>
                            </div>

                            <table>
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
                                <tbody>
            `

            produtos.forEach(produto => {
                html += `
                    <tr>
                        <td>${produto.id}</td>
                        <td>${produto.nome}</td>
                        <td>R$ ${Number(produto.preco).toFixed(2)}</td>
                        <td>${produto.quantidade}</td>
                        <td>${produto.categoria || ''}</td>
                        <td>
                            <a class="btn edit" href="/produtos/${produto.id}/editar">Editar</a>

                            <form action="/produtos/${produto.id}/deletar" method="POST" class="inline-form">
                                <button class="btn delete" type="submit">Excluir</button>
                            </form>
                        </td>
                    </tr>
                `
            })

            html += `
                                </tbody>
                            </table>
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