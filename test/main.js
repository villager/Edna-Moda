/**
 * 
 * Testing Our Lady
 * 
 */

"use strict";

const path = require('path');
const fs = require('fs');

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
    for (const file of files) {
        if(file.substr(-3) === '.js') {
            require(`${folder}/${file}`);
        }
    }
}
    
testFolder('./plugins');

