var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var schedule = require('node-schedule');

var apisRouter = require('./routes/apis');
var adminRouter = require('./routes/admin');
var newsController  = require('./controllers/newsController');

var j = schedule.scheduleJob('30 * * * *', function(){
    updateArticleList(newsController.updateArticleList);
});

function updateArticleList(callback){
    callback(null);
}

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(session({secret: 'Yaeyama'}));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', adminRouter);
app.use('/apis', apisRouter);

app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('admin/template/error');
});

module.exports = app;
