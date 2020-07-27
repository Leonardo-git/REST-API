const express = require('express');
const path = require('path');

const app = express();

const rotaProdutos = require('./routes/produtos');
const rotaPedidos = require('./routes/pedidos');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((request, response, next) => {
    response.header('Access-Control-Allow-Oringin', '*');
    response.header(
        'Access-Control-Allow-Header',
        'Origin, X-Requrested-Width, Content-Type, Accept, Authorization');
        
        if(request.method === 'OPTIONS')
        {
            response.header('Access-Control-Allow-Methods', 'GET')
            return response.status(200).send({});
        }
        next();
});

// === ROTAS === //
app.use('/produtos', rotaProdutos);
app.use('/pedidos', rotaPedidos);
// === /ROTAS === //

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.use((request, response, next) => {
    const erro = new Error('Não encontrado');
    erro.status = 404;
    next(erro);
});

app.use((error, request, response, next) => {
    response.status(error.status || 500);
    return response.send({
        erro: {
            mensagem: error.message
        }
    })
});

module.exports = app;