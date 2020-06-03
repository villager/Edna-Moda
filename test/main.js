/**
 * 
 * Testing Our Lady
 * 
 */

"use strict";

let fs = require("fs");
let path = require("path");

try {
	require.resolve('../config/config');
} catch (err) {
	if (err.code !== 'MODULE_NOT_FOUND' && err.code !== 'ENOENT') throw err; // Should never happen

	console.log("config.js doesn't exist - creating one with default settings...");
	fs.writeFileSync(
		path.resolve(__dirname, '../config/config.js'),
		fs.readFileSync(path.resolve(__dirname, '../config/config-example.js'))
	);
} finally {
    require('../bot');    
}

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

