#!/usr/bin/env node

var child_process = require("child_process");

function run() {
    child_process.execSync("node ./bot.js", {stdio: "inherit", cwd: __dirname});
}

var built = false;
function build() {
	child_process.execSync("node build", {stdio: "inherit", cwd: __dirname});
	built = true;
}

try {
    if (!built) build();
	run()
} catch(err) {
    if (err) throw err;
}