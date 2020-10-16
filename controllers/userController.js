'user strict';
require('dotenv').config();

var constants = require('../conf/constants');
var JWT = require('jsonwebtoken');
var request = require('request');

var JWT_KEY = 'Yaeyama';

let getToken = function(username) {
    return JWT.sign({ username: username }, JWT_KEY, { expiresIn: 60 * 60 * 24 });
};

exports.wpSignin = function(req, res) {
    console.log('apis/signin', req.body);
    var apiHost = 'http://www.yaeyama-nippo.co.jp/wp-json';
    var swmpHost = 'http://www.yaeyama-nippo.co.jp/?swpm_api_action=query&key=' + process.env.SWMP_API_KEY + '&email=';
    request.post(apiHost + '/jwt-auth/v1/token', {json: { username: req.body.username, password: req.body.password }}, function(err, response, body){
        if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});

        if (response.statusCode != 200){
            return res.json({success: false,message: 'ユーザIDやパスワードが正確ではありません。 また入力してください。',code: constants.AuthError});
        } else {
            request.get(swmpHost + body.user_email, function(err, response, body){
                if (err) return res.json({success: false,message: err.message,code: constants.ErrorCode});

                if (response.statusCode != 200){
                    return res.json({success: false,message: '会員情報を見つけることができません。',code: constants.AuthError});
                } else {
                    body = JSON.parse(body);
                    if (body.member_data.membership_level == 3){
                        return res.json({success: false,message: 'あなたは無料会員です。アプリを利用するには,プランをアップグレードしてください。',code: constants.FreeMembershipError});
                    } else {
                        return res.json({
                            success: true,
                            message: 'Login Success.',
                            code: constants.SuccessCode,
                            token: getToken(req.body.username)
                        });  
                    }
                }          
            });
        }
    });
};
exports.auth = function(req, res, next){
    console.log('auth', req.body);
    JWT.verify(req.body.token, JWT_KEY, function(err, decode) {
        if (err) return res.json({success: false,message: err.message,code: constants.JWTExpired});
        console.log(decode);
        next();
    });
};
