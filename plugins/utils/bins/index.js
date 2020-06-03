"use strict";

const Hastebin = require('./hastebin');
const Pastie = require('./pastie');

function upload(toUpload, callback) {
    try {
        Hastebin.upload(toUpload, callback);
    } catch (e) {
        Pastie.upload(toUpload, callback);
    }
}
function download(key, callback) {
    try {
        Hastebin.download(key, callback);
    } catch (e) {
        Pastie.download(key, callback);
    }
}

exports.Pastie = Pastie;
exports.Hastebin = Hastebin;

exports.upload = upload;
exports.download = download;