/**
 * 
 * Testing Our Lady
 * 
 */

"use strict";

let fs = require("fs");
let path = require("path");

require('../bot');

global.Config = require('../config/config-example');

Config.servers = {
    "testland":{
        id: 'testland',
        host: '0.0.0.0',
        port: 8000,
        rooms: ['mocha'],
        name: "Edna Moda",
        password: "Yourpasswordedna<3",
        language: 'english',
        initCmd: [],
    }
};


function testFolder(folder) {
    folder = path.resolve(__dirname, folder);
    let files = fs.readdirSync(folder);
    console.log(files);
    for (const file of files) {
        if(file.substr(-3) === '.js') {
            require(`${folder}/${file}`);
        }
    }
}

require('../bot');
testFolder('./plugins');