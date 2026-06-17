const conexao = require('../config/database')

function criarProduto(produto, callback) {
    const sql = `
        INSERT INTO produtos (nome, preco, quantidade, categoria)
        VALUES (?, ?, ?, ?)
    `
    conexao.query(sql, [
        produto.nome,
        produto.preco,
        produto.quantidade,
        produto.categoria
    ], callback)
}

function listarProdutos(callback) {
    const sql = `SELECT * FROM produtos ORDER BY nome`
    conexao.query(sql, callback)
}

function buscarProdutoPorId(id, callback) {
    const sql = `SELECT * FROM produtos WHERE id = ?`
    conexao.query(sql, [id], callback)
}

function buscarProdutoPorNome(nome, callback) {
    const sql = `SELECT * FROM produtos WHERE nome LIKE ? ORDER BY nome`
    conexao.query(sql, [`%${nome}%`], callback)
}

function atualizarProduto(id, produto, callback) {
    const sql = `
        UPDATE produtos
        SET nome = ?, preco = ?, quantidade = ?, categoria = ?
        WHERE id = ?
    `
    conexao.query(sql, [
        produto.nome,
        produto.preco,
        produto.quantidade,
        produto.categoria,
        id
    ], callback)
}

function deletarProduto(id, callback) {
    const sql = `DELETE FROM produtos WHERE id = ?`
    conexao.query(sql, [id], callback)
}

module.exports = {
    criarProduto,
    listarProdutos,
    buscarProdutoPorId,
    buscarProdutoPorNome,
    atualizarProduto,
    deletarProduto
}
