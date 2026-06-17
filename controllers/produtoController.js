const produtoModel = require('../models/produtoModel')

function criarProduto(req, res) {
    produtoModel.criarProduto(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar produto.')
        }
        res.redirect('/adm')
    })
}

function mostrarFormularioEdicao(req, res) {
    const { id } = req.params

    produtoModel.buscarProdutoPorId(id, (erro, resultados) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao buscar produto.')
        }
        if (resultados.length === 0) {
            return res.send('Produto não encontrado.')
        }

        const p = resultados[0]

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editar Produto</title>
            </head>
            <body>

                <form action="/produtos/${p.id}/editar" method="POST">
                    <fieldset>
                        <legend><b>Editar Produto</b></legend>

                        <br>

                        <label for="nome">Nome do produto:</label>
                        <input type="text" name="nome" id="nome" value="${p.nome}" required>

                        <br><br>

                        <label for="preco">Preço:</label>
                        <input type="number" name="preco" id="preco" step="0.01" min="0" value="${p.preco}" required>

                        <br><br>

                        <label for="quantidade">Quantidade:</label>
                        <input type="number" name="quantidade" id="quantidade" min="0" value="${p.quantidade}" required>

                        <br><br>

                        <label for="categoria">Categoria:</label>
                        <input type="text" name="categoria" id="categoria" value="${p.categoria || ''}">

                        <br><br>

                        <button type="submit">Salvar alterações</button>
                    </fieldset>
                </form>

                <br>
                <a href="/adm">Voltar ao painel</a>

            </body>
            </html>
        `

        res.send(html)
    })
}

function atualizarProduto(req, res) {
    const { id } = req.params

    produtoModel.atualizarProduto(id, req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao atualizar produto.')
        }
        res.redirect('/adm')
    })
}

function deletarProduto(req, res) {
    const { id } = req.params

    produtoModel.deletarProduto(id, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao excluir produto.')
        }
        res.redirect('/adm')
    })
}

module.exports = {
    criarProduto,
    mostrarFormularioEdicao,
    atualizarProduto,
    deletarProduto
}
