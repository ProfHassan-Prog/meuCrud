const express = require('express')
const path = require('path')

const usuarioRoutes = require('./routes/usuariosRoutes')
const produtoRoutes = require('./routes/produtosRoutes')
const admRoutes = require('./routes/admRoutes')

const app = express()
const port = 8000

// Middleware
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// Rotas
app.use('/usuarios', usuarioRoutes)
app.use('/produtos', produtoRoutes)
app.use('/adm', admRoutes)

// Página inicial
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

// Inicialização
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`)
})