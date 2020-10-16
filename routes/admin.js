var express = require('express');
var router = express.Router();

var newsController  = require('../controllers/newsController');
var adminController = require('../controllers/adminController');

var redirect = function(req, res, next) {
    if (req.session.admin) {
        next();
    } else {
        res.render('admin/login');
    }
};

router.get('/', function(req, res) {
    res.redirect('/login');
});
router.get('/login', redirect, function(req, res) {
    res.redirect('/all_news');
});
router.get('/all_news', redirect, function(req, res) {
    res.render('admin/all_news', req.session.admin);
});
router.get('/logout', function(req, res) {
    req.session.admin = null;
    res.redirect('/login');
});
router.get('/upload_news', redirect, function(req, res){
    res.render('admin/upload_news', req.session.admin);
});
router.get('*', function(req, res, next) {
    res.render('admin/template/error');
});

router.post('/signup', adminController.signup);
router.post('/signin', adminController.signin);
router.post('/getAllNews', newsController.getAllNews);
router.post('/deleteNews', newsController.deleteNews);
router.post('/uploadNews', newsController.uploadNews);

module.exports = router;
