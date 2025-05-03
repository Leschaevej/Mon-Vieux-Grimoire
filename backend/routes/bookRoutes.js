const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const multer = require('../middleware/multer-config');
const bookCtrl = require('../controllers/book');

router.get('/', bookCtrl.getAllBook);
router.get('/bestrating', bookCtrl.getBestRatedBooks);
router.post('/', auth, multer.upload, multer.imageProcessor, bookCtrl.createBook);
router.post('/:id/rating', bookCtrl.rateBook);
router.get('/:id', bookCtrl.getOneBook);
router.put('/:id', auth, multer.upload, multer.imageProcessor, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;