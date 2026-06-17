function criarUsuario(req, res) {
    res.send('Cadastro funcionando!')
}

function listarUsuarios(req, res) {
    res.send('Listagem funcionando!')
}

function atualizarUsuario(req, res) {
    res.send('Atualização funcionando!')
}

function deletarUsuario(req, res) {
    res.send('Exclusão funcionando!')
}

module.exports = {
    criarUsuario,
    listarUsuarios,
    atualizarUsuario,
    deletarUsuario
}