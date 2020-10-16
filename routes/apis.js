var express = require('express');
var router = express.Router();

var userController = require('../controllers/userController');
var newsController = require('../controllers/newsController');

router.post('/signin', userController.wpSignin);
router.post('/getPDFList', userController.auth, newsController.getPDFList);
router.post('/getArticleList', newsController.getArticleList);

module.exports = router;
