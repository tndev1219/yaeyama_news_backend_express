'user strict';
require('dotenv').config();

var crypto = require('crypto');

var constants = require('../conf/constants');
var AdminModel = require('../models/adminModel');

var returnError = function(err, res) {
    return res.json({
        success: false,
        message: err,
        code: constants.ErrorCode
    });
};

exports.signup = function(req, res) {
    console.log('signup', req.body);
    var admin = new AdminModel();
    admin.userid = 'admin';
    admin.password = crypto.createHash('md5').update('admin123').digest('hex');
    admin.usertype = '1';
    admin.tokenid = '';
    admin.save(function (err) {
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        return res.json({
            success: true,
            msg: 'New admin created!',
            code: constants.SuccessCode,
            result: admin
        });
    });
};

exports.signin = function(req, res) {
    console.log('signin', req.body);
    AdminModel.findOne({userid: req.body.userid}).exec(function (err, admin) {
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});
        
        if (!admin || admin.password != crypto.createHash('md5').update(req.body.password).digest('hex')) { 
            return res.json({
                success: false,
                msg: 'Authentication failed!',
                code: constants.AuthError,
            });
        } else {
            req.session.admin = admin;
            return res.json ({
                success: true,
                msg: 'Login Success!',
                code: constants.SuccessCode,
                result: admin
            });
        }
    });
};

