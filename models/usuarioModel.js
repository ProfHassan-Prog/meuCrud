const conexao = require('../config/database')

function criarUsuario(usuario, callback) {

    const sql = `
        INSERT INTO usuarios
        (
            nome,
            email,
            senha,
            telefone,
            genero,
            data_nascimento,
            cidade,
            estado,
            endereco
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    conexao.query(
        sql,
        [
            usuario.nome,
            usuario.email,
            usuario.senha,
            usuario.telefone,
            usuario.genero,
            usuario.data_nascimento,
            usuario.cidade,
            usuario.estado,
            usuario.endereco
        ],
        callback
    )
}

module.exports = {
    criarUsuario
}