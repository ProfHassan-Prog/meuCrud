const mysql = require('mysql2')

const conexao = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'meuCrud'
})

conexao.connect((erro) => {
    if (erro) {
        console.log('Erro ao conectar ao banco:', erro)
        return
    }

    console.log('Banco conectado com sucesso!')
})

module.exports = conexao