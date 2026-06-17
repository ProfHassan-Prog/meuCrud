const express = require('express')
const router = express.Router()

const usuarioController = require('../controllers/usuarioController')

router.post('/', usuarioController.criarUsuario)
router.get('/:id/editar', usuarioController.mostrarFormularioEdicao)
router.post('/:id/editar', usuarioController.atualizarUsuario)
router.post('/:id/deletar', usuarioController.deletarUsuario)

module.exports = router
