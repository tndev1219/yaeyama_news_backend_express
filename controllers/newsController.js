'user strict';
require('dotenv').config();
var formidable = require('formidable');
var path = require('path');
var fs = require('fs');
var Bcrypt = require('bcrypt');
var request = require('request');
var PDFImage = require("pdf-image").PDFImage;
var exec = require("child_process").exec;
var NewsModel = require('../models/newsModel');
var ArticleModel = require('../models/articleModel');
var constants = require('../conf/constants');

var dateFormatChange =  function(str){
    var temp = str.split('T')[0];
    temp = temp.split('-');
    temp = addZero(parseInt(temp[1])) + '月' + addZero(parseInt(temp[2])) + '日';
    return temp;
};

var addZero = function(num){
    return num < 10 && (num = "0" + num), num;
};

exports.uploadNews = function(req, res) {
    if (req.url == '/uploadNews'){
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files){
            if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
            var oldpath = files.fileupload.path;
            var absolutepath = path.join(__dirname, "../public/uploads/");
            var relativepath = "uploads/";

            fs.readFile(oldpath, function (err, data) {
                if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});

                Bcrypt.genSalt(20, function(err, salt) {
                    if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});

                    var prename = salt.replace("/", "").split("$").join("");
                    var pdffilename = "news_" + prename + '.pdf';
                    var jpgfilename = "news_" + prename + '.jpg';

                    fs.writeFile(absolutepath + pdffilename, data, function(err) {
                        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});

                        fs.unlink(oldpath, function (err) {
                            if (err) {
                                fs.unlink(absolutepath+pdffilename, function () {});
                                return res.json({success: false,message: err.message,code: constants.ErrorCode});
                            }                            

                            var pdfImage = new PDFImage(absolutepath+pdffilename, {convertOptions:{'-density':'150'}});
                            pdfImage.convertPage(0).then(function (imagePath) {
                                var resizeCommand = 'convert -resize 370x500 "' + imagePath + '" "' + imagePath + '"';
                                exec(resizeCommand, function(err){
                                    if (err){
                                        fs.unlink(absolutepath+pdffilename, function () {});
                                        fs.unlink(absolutepath+jpgfilename, function () {});
                                        return res.json ({success: false,msg: err.message,code: constants.ExistError}); 
                                    }

                                    var news = new NewsModel();
                                    var temp_date = fields.uploadDate.split('/');
                                    news.date = temp_date[2]+'.'+temp_date[0]+'.'+temp_date[1];
                                    news.title = pdffilename;
                                    news.url = relativepath + pdffilename;
                                    news.thumb = relativepath + jpgfilename;
                                    news.description = fields.description;
                                    news.created = new Date();
                                    news.save(function (err) {
                                        if (err){
                                            fs.unlink(absolutepath+pdffilename, function () {});
                                            fs.unlink(absolutepath+jpgfilename, function () {});
                                            return res.json ({success: false,msg: err.message,code: constants.ExistError}); 
                                        } 
                                        return res.json ({success: true,msg: 'Upload news success!',code: constants.SuccessCode});                                    
                                    });                                            
                                });                         
                            }, function (err) {
                                fs.unlink(absolutepath+pdffilename, function () {});
                                return res.json({success: false,message: err.message,code: constants.ErrorCode});
                            });                                                      
                        });                      
                    });
                });
            });
        });
    }
};

exports.getAllNews = function(req, res) {
    console.log('news/getAllNews');
    NewsModel.find(function (err, news) {
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        return res.json ({success: true,msg: 'Get all news Success!',code: constants.SuccessCode,result: news});
    });
};

exports.deleteNews = function(req, res) {
    console.log('news/deleteNews', req.body);
    NewsModel.findOne({date: req.body.date}).exec(function (err, news) {
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        
        var filepath = path.join(__dirname, "../public/") + news.url;
        fs.unlink(filepath, function (err) {
            if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
            filepath = path.join(__dirname, "../public/") + news.thumb;
            fs.unlink(filepath, function (err) {
                if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});                    
                NewsModel.deleteOne(req.body).exec(function (err) {
                    if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
                    return res.json ({success: true,msg: 'Delete news Success!',code: constants.SuccessCode});                    
                });
            });
        });
    });
};

exports.getPDFList = function(req, res) {
    NewsModel.find({}, { _id: 0, date: 1, url: 1, thumb: 1 }).sort({date: -1}).limit(7).exec(function (err, news) {
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        var data = [];
        for (let item of news) {
            data.push({
                date: item.date,
                url: process.env.SERVER_URL + item.url,
                thumb: process.env.SERVER_URL + item.thumb,
            });
        }
        return res.json ({ success: true, msg: 'Get PDFList Success!', code: constants.SuccessCode, result: data});
    });
};

function GetSortOrder(prop) {  
    return function(a, b) {  
        if (a[prop] < b[prop]) {  
            return 1;  
        } else if (a[prop] > b[prop]) {  
            return -1;  
        }  
        return 0;  
    };  
}  

exports.getArticleList = function(req, res) {
    ArticleModel.find({}, { _id: 0, topnews: 1, commonnews: 1 }).sort({date: -1}).exec(function(err, articles){
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        articles[0].commonnews.sort(GetSortOrder("date"));
        return res.json ({ success: true, msg: 'Get ArticleList Success!', code: constants.SuccessCode, result: articles[0]});
    });     
};

exports.updateArticleList = function() {
    var article = new ArticleModel();
    var article_topnews = [];
    var article_commonnews = [];
    var article_image = [];
    request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/media', function(err, response, body){
        if (err) {
            console.log('Get ArticleList Error', err.message);
        } else {            
            var data = JSON.parse(body);
            if (data[0] != undefined && data[1] != undefined && data[2] != undefined && data[3] != undefined && data[4] != undefined && data[5] != undefined){
                for (var i = 0; i < 6; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else if (data[0] != undefined && data[1] != undefined && data[2] != undefined && data[3] != undefined && data[4] != undefined) {
                for (var i = 0; i < 5; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else if (data[0] != undefined && data[1] != undefined && data[2] != undefined && data[3] != undefined) {
                for (var i = 0; i < 4; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else if (data[0] != undefined && data[1] != undefined && data[2] != undefined) {
                for (var i = 0; i < 3; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else if (data[0] != undefined && data[1] != undefined) {
                for (var i = 0; i < 2; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else if (data[0] != undefined) {
                for (var i = 0; i < 1; i++){
                    article_image.push({
                        date: dateFormatChange(data[i].date),
                        image: data[i].media_details.sizes.size2.source_url, 
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[i].post
                    });    
                }
            } else {
                article_image.push({
                });
            }
            article_topnews.push({
                date: data[0].date,
                images: article_image
            });
            article.topnews = article_topnews;
            request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/posts?categories=4', function(err, response, body){
                if (err) {
                    console.log('Get ArticleList Error', err.message);
                } else {
                    data = JSON.parse(body);
                    article_commonnews.push({
                        date: dateFormatChange(data[0].date),
                        title: data[0].title.rendered,
                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[0].id
                    });
                    request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/posts?categories=5', function(err, response, body){
                        if (err) {
                            console.log('Get ArticleList Error', err.message);
                        } else {
                            data = JSON.parse(body);
                            article_commonnews.push({
                                date: dateFormatChange(data[0].date),
                                title: data[0].title.rendered,
                                link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[0].id
                            });
                            request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/posts?categories=3', function(err, response, body){
                                if (err) {
                                    console.log('Get ArticleList Error', err.message);
                                } else {
                                    data = JSON.parse(body);
                                    article_commonnews.push({
                                        date: dateFormatChange(data[0].date),
                                        title: data[0].title.rendered,
                                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[0].id
                                    });
                                    request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/posts?categories=6', function(err, response, body){
                                        if (err) {
                                            console.log('Get ArticleList Error', err.message);
                                        } else {
                                            data = JSON.parse(body);
                                            article_commonnews.push({
                                                date: dateFormatChange(data[0].date),
                                                title: data[0].title.rendered,
                                                link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[0].id
                                            });
                                            request('http://www.yaeyama-nippo.co.jp/wp-json/wp/v2/posts?categories=9', function(err, response, body){
                                                if (err) {
                                                    console.log('Get ArticleList Error', err.message);
                                                } else {
                                                    data = JSON.parse(body);
                                                    article_commonnews.push({
                                                        date: dateFormatChange(data[0].date),
                                                        title: data[0].title.rendered,
                                                        link: 'http://www.yaeyama-nippo.co.jp/archives/' + data[0].id
                                                    });
                                                    article.topnews = article_topnews;
                                                    article.commonnews = article_commonnews;
                                                    article.created = new Date();
                                                    ArticleModel.findOne(function(err, old_articles){
                                                        if (err) {
                                                            console.log('Find ArticleList Error', err.message);
                                                        } else if (old_articles != undefined) {
                                                            for (var i = 0; i < article_image.length; i++){
                                                                old_articles.topnews[0].images[i] = article_image[i];
                                                            }
                                                            article_topnews[0].images = old_articles.topnews[0].images;
                                                            var myquery = {_id: old_articles._id};
                                                            var newvalues = {$set: {topnews: article_topnews, commonnews: article_commonnews}};
                                                            ArticleModel.updateOne(myquery, newvalues, function(err){
                                                                if (err) {
                                                                    console.log('Update ArticleList Error', err.message);
                                                                }
                                                            });
                                                        } else {
                                                            article.save(function(err){
                                                                if (err) {
                                                                    console.log('Save ArticleList Error', err.message);
                                                                }
                                                            });          
                                                        }
                                                    });
                                                }
                                            });  
                                        }
                                    });  
                                }
                            });  
                        }
                    });  
                }
            });                 
        }
    });    
};