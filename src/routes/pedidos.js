const express = require('express');
const router = express.Router();
const mysql = require('../databases/connection').pool;

router.get('/', (request, response, next) => {

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({error: error});
        }

        conn.query(
            'SELECT * FROM tb_requests',
            (error, result, field) => {
                
                conn.release();

                if(error){
                    return response.status(500).send({error: error});
                }

                const json = {
                    amount: result.length,
                    requests: result.map(req => {
                        return {
                            id_request: req.id_request,
                            amount: req.amount,
                            id_product: req.id_product
                        }
                    }),
                }

                return response.status(200).send(json);
            }
        );
    });
});

router.get('/:id_request', (request, response, next) => {

    const id_request = request.params.id_request;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({error: error});
        }

        conn.query(
            `SELECT * FROM 
            tb_requests 
            INNER JOIN 
            tb_products 
            ON 
            tb_products.id_product = tb_requests.id_request 
            WHERE 
            id_request = ?`,
            [id_request],
            (error, result, field) => {
                
                conn.release();

                if(error){
                    return response.status(500).send({error: error});
                }

                if(result.length == 0){
                    return response.status(404).send({
                        message: 'Nenhum resultado encontrado'
                    });
                }
                
                const json = {
                    requests: {
                        id_request: result[0].id_request,
                        amount: result[0].amount,
                        product: {
                            id_product: result[0].id_product,
                            product: result[0].product,
                            value: result[0].value,
                            message: 'Detalhe Produto listado',
                            url: 'http://localhost:3000/produtos/' + result[0].id_product
                        }
                    }
                }

                return response.status(200).send(json);
            }
        );
    });
});

router.post('/', (request, response, next) => {

    const { amount, id_product } = request.body;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({error: error});
        }

        conn.query(
            'SELECT * FROM tb_products WHERE id_product = ?',
            [id_product],
            (error, result, field) => {

                if(error){
                    conn.release();
                    return response.status(500).send({
                        error: error
                    })
                }

                if(result.length == 0){
                    conn.release();
                    return response.status(404).send({
                        message: 'Produto não encontrado'
                    })
                }

                conn.query(
                    'INSERT INTO tb_requests (amount, id_product) VALUES (?, ?)',
                    [amount, id_product],
                    (error, result, field) => {
                        
                        conn.release();

                        if(error){
                            return response.status(500).send({error: error});
                        }

                        const json = {
                            message: 'Pedido inserido',                  
                            id_request: result.insertId,
                            amount: amount,
                            id_product: id_product,
                            request: {
                                method: 'GET',
                                desc: 'Retorna todos os pedidos',
                                url: 'http://localhost:3000/pedidos'
                            }
                        }
                        return response.status(201).send(json);
                    }
                )
            }
        );
    });
});

router.put('/', (request, response, next) => {

    const {id_request, amount, id_product} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({error: error});
        }

        conn.query(
            'UPDATE tb_requests SET amount = ?, id_product = ? WHERE id_request = ?',
            [amount, id_product, id_request],
            (error, result, field) => {

                conn.release();

                if(error){
                    return response.status(500).send({error: error});
                }

                const json = {
                    message: 'Pedido alterado',
                    pedido: {
                        id_request: id_request,
                        url: 'http://localhost:3000/pedidos/' + id_request
                    }
                }

                return response.status(202).send(json);
            }
        );
    });
});

router.delete('/', (request, response, next) => {

    const {id_request} = request.body;
    
    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({error: error});
        }

        conn.query(
            'DELETE FROM tb_requests WHERE id_request = ?',
            [id_request],
            (error, result, field) => {

                conn.release();

                if(error){
                    return response.status(500).send({error: error});
                }

                const json = {
                    message: 'Pedido excluido',
                    pedido_excluido: {
                        id_request: id_request,                        
                    }
                }

                return response.status(202).send(json);
            }
        );
    });
});

module.exports = router;