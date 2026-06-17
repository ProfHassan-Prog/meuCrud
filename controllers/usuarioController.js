const usuarioModel = require('../models/usuarioModel')

const ESTADOS = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
    ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'],
    ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
    ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']
]

function formatarData(valor) {
    if (!valor) return ''
    if (valor instanceof Date) return valor.toISOString().split('T')[0]
    return String(valor).split('T')[0]
}

function criarUsuario(req, res) {
    usuarioModel.criarUsuario(req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao cadastrar usuário.')
        }
        res.redirect('/adm')
    })
}

function mostrarFormularioEdicao(req, res) {
    const { id } = req.params

    usuarioModel.buscarUsuarioPorId(id, (erro, resultados) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao buscar usuário.')
        }
        if (resultados.length === 0) {
            return res.send('Usuário não encontrado.')
        }

        const u = resultados[0]

        const opcoesEstado = ESTADOS.map(([sig, nome]) =>
            `<option value="${sig}" ${u.estado === sig ? 'selected' : ''}>${nome}</option>`
        ).join('\n')

        const html = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Editar Usuário</title>
            </head>
            <body>

                <form action="/usuarios/${u.id}/editar" method="POST">
                    <fieldset>
                        <legend><b>Editar Usuário</b></legend>

                        <br>

                        <label for="nome">Nome Completo:</label>
                        <input type="text" name="nome" id="nome" value="${u.nome}" required>

                        <br><br>

                        <label for="email">E-mail:</label>
                        <input type="email" name="email" id="email" value="${u.email}" required>

                        <br><br>

                        <label for="telefone">Telefone:</label>
                        <input type="tel" name="telefone" id="telefone" value="${u.telefone || ''}">

                        <br><br>

                        <p>Sexo:</p>

                        <input type="radio" name="genero" id="feminino" value="feminino" ${u.genero === 'feminino' ? 'checked' : ''}>
                        <label for="feminino">Feminino</label>

                        <input type="radio" name="genero" id="masculino" value="masculino" ${u.genero === 'masculino' ? 'checked' : ''}>
                        <label for="masculino">Masculino</label>

                        <input type="radio" name="genero" id="outro" value="outro" ${u.genero === 'outro' ? 'checked' : ''}>
                        <label for="outro">Outro</label>

                        <br><br>

                        <label for="data_nascimento">Data de Nascimento:</label>
                        <input type="date" name="data_nascimento" id="data_nascimento" value="${formatarData(u.data_nascimento)}">

                        <br><br>

                        <label for="cidade">Cidade:</label>
                        <input type="text" name="cidade" id="cidade" value="${u.cidade || ''}">

                        <br><br>

                        <label for="estado">Estado:</label>
                        <select name="estado" id="estado">
                            <option value="">Selecione um estado</option>
                            ${opcoesEstado}
                        </select>

                        <br><br>

                        <label for="endereco">Endereço:</label>
                        <input type="text" name="endereco" id="endereco" value="${u.endereco || ''}">

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

function atualizarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.atualizarUsuario(id, req.body, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao atualizar usuário.')
        }
        res.redirect('/adm')
    })
}

function deletarUsuario(req, res) {
    const { id } = req.params

    usuarioModel.deletarUsuario(id, (erro) => {
        if (erro) {
            console.log(erro)
            return res.send('Erro ao excluir usuário.')
        }
        res.redirect('/adm')
    })
}

module.exports = {
    criarUsuario,
    mostrarFormularioEdicao,
    atualizarUsuario,
    deletarUsuario
}
