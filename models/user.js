const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;

const readlinglistSchema = new Schema({
    key: {
        type: String,
        default: '',
        required: true
    },
    cover_i: {
        type: String,
        default: '',
        required: true
    },
    title: {
        type: String,
        default: '',
        required: true
    },
    markRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const userSchema = new Schema({
    firstname: {
        type: String,
        default: ''
    },
    lastname: {
        type: String,
        default: ''
    },
    admin: {
        type: Boolean,
        default: false
    },
    readinglist: [readlinglistSchema]
}, {
    timestamps: true
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);