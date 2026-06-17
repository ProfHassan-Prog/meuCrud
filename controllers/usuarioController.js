const usuarioModel = require('../models/usuarioModel')

function criarUsuario(req, res) {

    usuarioModel.criarUsuario(
        req.body,
        (erro, resultado) => {

            if (erro) {
                console.log(erro)
                return res.send('Erro ao cadastrar usuário.')
            }

            res.send('Usuário cadastrado com sucesso!')
        }
    )
}

module.exports = {
    criarUsuario
}