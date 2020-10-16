var mongoose = require('mongoose');
var connection = require('../lib/database');

var newsSchema = mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    title: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    thumb: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
    },
    created: {
        type: Date
    },
});

module.exports = mongoose.model('news', newsSchema);
