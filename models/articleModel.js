var mongoose = require('mongoose');
var connection = require('../lib/database');

var articleSchema = mongoose.Schema({
    topnews: {
        type: Object,
        required: true,
    },
    commonnews: {
        type: Object,
        required: true,
    },
    created: {
        type: Date
    },
});

module.exports = mongoose.model('articles', articleSchema);