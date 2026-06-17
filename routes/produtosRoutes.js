const express = require('express')
const router = express.Router()

const produtoController = require('../controllers/produtoController')

router.post('/', produtoController.criarProduto)
router.get('/:id/editar', produtoController.mostrarFormularioEdicao)
router.post('/:id/editar', produtoController.atualizarProduto)
router.post('/:id/deletar', produtoController.deletarProduto)

module.exports = router
