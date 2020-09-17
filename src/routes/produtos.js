const express = require('express');
const router = express.Router();
const mysql = require('../databases/connection').pool;
const multer = require('multer');
const multerConfig = require('../config/multer');
const login = require('../middleware/login');

router.get('/', (request, response, next) => {

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({
                error: error
            });
        }

        conn.query(
            'SELECT * FROM tb_products',
            (error, result, field) => {
                conn.release();

                if(error){
                    return response.status(500).send({
                        error: error
                    });
                }
                const json = {
                    amount: result.length,
                    products: result.map(prod => {
                        return {
                            id_product: prod.id_product,
                            product: prod.product,
                            value: prod.value,
                            img_product: prod.img_product,
                            request: {
                                method: 'GET',
                                desc: 'Detalhes do produto',
                                url: 'http://localhost:3000/produtos/' + prod.id_product
                            }
                        }
                    }),
                }
                return response.status(200).send(json);
            }
        );
    });
});

router.get('/:id_product', (request, response, next) => {

    const id_product = request.params.id_product;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({
                error: error
            });
        }

        conn.query(
            'SELECT * FROM tb_products WHERE id_product = ?',
            [id_product],
            (error, result, field) => {
                conn.release();

                if(error){
                    return response.status(500).send({
                        error: error
                    });
                }
                if(result.length == 0){
                    return response.status(404).send({
                        message: 'Produto não encontrado'
                    });
                }
                const json = {
                    products: result.map(prod => {
                        return {
                            id_product: prod.id_product,
                            product: prod.product,
                            img_product: prod.img_product,
                            request: {
                                method: 'GET',
                                desc: 'Todos os produtos',
                                url: 'http://localhost:3000/produtos'
                            }
                        }
                    }),
                }
                return response.status(200).send(json);
            }
        );
    });
});

router.post('/', login, multer(multerConfig).single('photo'), (request, response, next) => {

    const {product, value} = request.body;
    const img = "http://localhost:3000/uploads/" + request.file.filename;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({
                error: error
            });
        }

        conn.query(
            'INSERT INTO tb_products (product, value, img_product) VALUES (?, ?, ?)',
            [product, value, img],
            (error, result, field) => {
                conn.release();

                if(error){
                    return response.status(500).send({
                        error: error,
                        response: null
                    });
                }
                const json = {
                    message: 'Produto inserido',
                    products: {
                        id_product: result.insertId,
                        product: product,
                        value: value,
                        img_product: img,
                        request: {
                            method: 'GET',
                            desc: 'Detalhes do produto',
                            url: 'http://localhost:3000/produtos/' + result.insertId
                        }
                    },
                }
                return response.status(201).send(json);
            }
        )
    });
});

router.put('/', login, multer(multerConfig).single('photo'),(request, response, next) => {

    const {id_product, product, value} = request.body;
    const img = "http://localhost:3000/uploads/" + request.file.filename;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({
                error: error
            });
        }

        conn.query(
            'UPDATE tb_products SET product = ?, value = ?, img_product = ? WHERE id_product = ?',
            [product, value, img, id_product],
            (error, result, field) => {
                conn.release();

                if(error){
                    return response.status(500).send({
                        error: error,
                        response: null
                    });
                }

                const json = {
                    message: 'Produto atualizado',
                    products: {
                        id_product: id_product,
                        product: product,
                        value: value,
                        img_product: img,
                        request: {
                            method: 'GEt',
                            desc: 'Detalhes do produto',
                            url: 'http://localhost:3000/produtos/' + id_product
                        }
                    },
                }
                return response.status(202).send(json);
            }
        )
    });
});

router.delete('/', login, (request, response, next) => {
    const {id_product} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){
            return response.status(500).send({
                error: error
            });
        }
        conn.query(
            'SELECT * FROM tb_products WHERE id_product = ?',
            [id_product],
            (error, result, field) => {
                if(error){
                    conn.release();
                    return response.status(500).send({error: error})
                }
                if(result.length == 0){
                    conn.release();
                    return response.status(404).send({message: 'Produto não encontrado'})
                }else{
                    conn.query(
                        'DELETE FROM tb_products WHERE id_product = ?',
                        [id_product],
                        (error, result, field) => {
                            conn.release();
            
                            if(error){
                                return response.status(500).send({
                                    error: error,
                                    response: null
                                });
                            }
            
                            const json = {
                                message: 'Produto removido',
                            }
            
                            response.status(202).send(json);
                        }
                    );
                }
            }
        );
    });
});

module.exports = router;