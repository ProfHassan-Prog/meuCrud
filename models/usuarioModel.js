const conexao = require('../config/database')

function criarUsuario(usuario, callback) {
    const sql = `
        INSERT INTO usuarios
        (nome, email, senha, telefone, genero, data_nascimento, cidade, estado, endereco)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    conexao.query(sql, [
        usuario.nome,
        usuario.email,
        usuario.senha,
        usuario.telefone,
        usuario.genero,
        usuario.data_nascimento,
        usuario.cidade,
        usuario.estado,
        usuario.endereco
    ], callback)
}

function listarUsuarios(callback) {
    const sql = `SELECT * FROM usuarios ORDER BY nome`
    conexao.query(sql, callback)
}

function buscarUsuarioPorId(id, callback) {
    const sql = `SELECT * FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}

function buscarUsuarioPorNome(nome, callback) {
    const sql = `SELECT * FROM usuarios WHERE nome LIKE ? ORDER BY nome`
    conexao.query(sql, [`%${nome}%`], callback)
}

function atualizarUsuario(id, usuario, callback) {
    const sql = `
        UPDATE usuarios
        SET nome = ?, email = ?, telefone = ?, genero = ?, data_nascimento = ?, cidade = ?, estado = ?, endereco = ?
        WHERE id = ?
    `
    conexao.query(sql, [
        usuario.nome,
        usuario.email,
        usuario.telefone,
        usuario.genero,
        usuario.data_nascimento,
        usuario.cidade,
        usuario.estado,
        usuario.endereco,
        id
    ], callback)
}

function deletarUsuario(id, callback) {
    const sql = `DELETE FROM usuarios WHERE id = ?`
    conexao.query(sql, [id], callback)
}

module.exports = {
    criarUsuario,
    listarUsuarios,
    buscarUsuarioPorId,
    buscarUsuarioPorNome,
    atualizarUsuario,
    deletarUsuario
}
