const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

// Configuration de multer
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype] || 'jpg';
        callback(null, name + Date.now() + '.' + extension);
    }
});

const fileFilter = (req, file, callback) => {
    if (MIME_TYPES[file.mimetype]) {
        callback(null, true);
    } else {
        callback(new Error('Format de fichier non autorisé'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
    fileFilter: fileFilter
}).single('image');

// Middleware de traitement d'image avec Sharp
const imageProcessor = (req, res, next) => {
    if (req.file && req.file.mimetype.startsWith('image')) {
        const inputPath = req.file.path;
        const outputFileName = path.parse(req.file.filename).name + '.webp';
        const outputPath = path.join('images', outputFileName);

        sharp(inputPath)
            .metadata()
            .then(meta => {
                if (meta.size > 5 * 1024 * 1024) {
                    throw new Error('Fichier image trop volumineux après analyse');
                }

                return sharp(inputPath)
                    .resize(800, 800, { fit: 'inside' })
                    .webp({ quality: 80 })
                    .toFile(outputPath);
            })
            .then(() => {
                fs.unlink(inputPath, (err) => {
                    if (err) console.error('Erreur de suppression de l’image originale :', err);
                });

                req.file.filename = outputFileName;
                req.file.path = outputPath;
                next();
            })
            .catch(err => {
                next(err);
            });
    } else {
        next();
    }
};

module.exports = {
    upload: upload,
    imageProcessor: imageProcessor
};