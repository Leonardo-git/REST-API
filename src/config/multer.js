const multer = require('multer');
const path = require('path');
const moment = require('moment');

module.exports = {
    dest: path.resolve(__dirname, '..','..', 'uploads'),
    storage: multer.diskStorage({
        destination: (request, file, callback) => {
            callback(null, path.resolve(__dirname, '..','..', 'uploads'));
        },
        filename: (request, file, callback) => {
            const name = Math.floor(Math.random() * 1000);
            const name2 = Math.floor(Math.random() * 1000);
            const fileName = `${name}${name2}-${file.originalname}`;
            callback(null, fileName);
        },
    }),
    limits: {
        fileSize: 2 * 1024 * 1024,
    },
    fileFilter: (request, file, callback) => {
        const allowedMimes = [
            'image/jpg',
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif'
        ];

        if(allowedMimes.includes(file.mimetype)){
            callback(null, true);
        }else{
            callback(new Error('Invalid form'));
        }
    }
}

