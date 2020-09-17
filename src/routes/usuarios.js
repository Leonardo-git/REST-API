const express = require('express');
const router = express.Router();
const mysql = require('../databases/connection').pool;
const bcrypt = require('bcrypt');
const { request, response } = require('express');
const jwt = require('jsonwebtoken');

router.get('/', (request, response, next) => {

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}

        conn.query(`SELECT * FROM tb_users`,
            (error, result) => {
                conn.release();
                
                if(error){return response.status(500).send({error: error})}

                if(result.length === 0){return response.status(404).send({message: "Nenhum cadastro encontrado"})}

                const json = {
                    amount: result.length,
                    usuarios: result.map(user => {
                        return {
                            id: user.id_users,
                            name: user.name,
                            email: user.email
                        }
                    })
                }
                return response.status(200).send(json);
            }
        );
    });
});

router.get('/:id', (request, response, next) => {

    const {id} = request.params;

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}

        conn.query(`SELECT * FROM tb_users WHERE id_users = ?`,
        [id],
        (error, result) => {
            conn.release();
            
            if(error){return response.status(500).send({error: error})}

            if(result.length === 0){return response.status(404).send({message: "Cadastro não encontrado"})}

            const json = {
                amount: result.length,
                usuarios: result.map(user => {
                    return {
                        id: user.id_users,
                        name: user.name,
                        email: user.email
                    }
                })
            }
            return response.status(200).send(json);
        });
    });
});

router.post('/', (request, response, next) => {

    const {name, email, password} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}

        conn.query('SELECT * FROM tb_users WHERE email = ?', 
        [email],
        (error, result) => {
            if(error){return response.status(500).send({error: error})}

            if(result.length !== 0){
                conn.release();
                return response.status(409).send({error: 'Usuário já cadastrado'});
            }else{
                bcrypt.hash(password, 10, (errorBcrypt, hash) => {
                    if(errorBcrypt){return response.status(500).send({error: errorBcrypt})}
        
                    conn.query(`INSERT INTO tb_users (name, email, password) VALUES (?, ?, ?)`,
                        [name, email, hash],
                        (error, result) => {
                            conn.release();
                            
                            if(error){return response.status(500).send({error: error})}
        
                            const json = {
                                message: 'Usuário criado com sucesso',
                                usuario: {
                                    id: result.insertId,
                                    nome: name,
                                    email: email
                                }
                            }
                            return response.status(201).send(json);
                        }
                    );
                });
            }
        });
    });
});

router.put('/', (request, response, next) => {

    const {id, name, email, password} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}

        conn.query('SELECT * FROM tb_users WHERE id_users = ?', 
        [id],
        (error, result) => {
            if(error){return response.status(500).send({error: error})}

            if(result.length === 0){
                conn.release();
                return response.status(404).send({error: 'Usuário não encontrado'});
            }else{
                bcrypt.hash(password, 10, (errorBcrypt, hash) => {
                    if(errorBcrypt){return response.status(500).send({error: errorBcrypt})}
        
                    conn.query(`UPDATE tb_users SET name = ?, email =?, password = ? WHERE id_users = ?`,
                        [name, email, hash, id],
                        (error, result) => {
                            conn.release();
                            
                            if(error){return response.status(500).send({error: error})}
        
                            const json = {
                                message: 'Usuário atualizado com sucesso',
                                usuario: {
                                    id: id,
                                    nome: name,
                                    email: email
                                }
                            }
                            return response.status(202).send(json);
                        }
                    );
                });
            }
        });
    });
});

router.delete('/', (request, response, next) => {

    const {id} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}

        conn.query('SELECT * FROM tb_users WHERE id_users = ?', 
        [id],
        (error, result) => {
            if(error){return response.status(500).send({error: error})}

            if(result.length === 0){
                conn.release();
                return response.status(404).send({error: 'Usuario não encontrado'});
            }else{
                conn.query(`DELETE FROM tb_users WHERE id_users = ?`,
                [id],
                (error, result) => {
                    conn.release();
                    
                    if(error){return response.status(500).send({error: error})}

                    const json = {
                        message: 'Usuário deletado com sucesso',
                        usuario: {
                            id: id
                        }
                    }
                    return response.status(202).send(json);
                });
            }
        });
    });
});

router.post('/login', (request, response, next) => {

    const {email, password} = request.body;

    mysql.getConnection((error, conn) => {
        if(error){return response.status(500).send({error: error})}
        
        const query = `SELECT * FROM tb_users WHERE email = ?`;

        conn.query(
            query,
            [email],
            (error, result, field) => {
                conn.release();
                
                if(error){return response.status(500).send({error: error})}
                if(result.length < 1){
                    return response.status(401).send({error: 'Falha na autenticação'});
                }
                bcrypt.compare(password, result[0].password, (errorBcrypt, resultBcrypt) => {
                    if(errorBcrypt){
                        return response.status(401).send({error: 'Falha na autenticação'});
                    }
                    if(resultBcrypt){
                        const token = jwt.sign({
                            id_users: result[0].id_users,
                            email: result[0].email
                        }, process.env.JWT_KEY,
                        {
                            expiresIn: "1h"
                        });

                        return response.status(200).send({
                            message: 'Autenticado com sucesso',
                            token: token
                        });
                    }
                    return response.status(401).send({error: 'Falha na autenticação'});
                });

            });
    });
});

module.exports = router;