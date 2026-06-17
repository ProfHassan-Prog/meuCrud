const conexao = require('../config/database')

function listarProdutos(callback) {
    const sql = `
        SELECT *
        FROM produtos
    `

    conexao.query(sql, callback)
}

module.exports = {
    listarProdutos
}