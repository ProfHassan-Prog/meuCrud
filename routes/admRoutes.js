const express = require('express')
const router = express.Router()

const admController = require('../controllers/admController')

router.get('/', admController.painelAdm)

module.exports = router