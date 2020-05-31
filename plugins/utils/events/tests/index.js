"use strict";

const fs = require('fs');
const path = require('path');
const Module = require('module');

const RESOLUTION_STEP_KEY = (() => {
    try {
        require('mock-fs-require-fix');
        return Object.getOwnPropertySymbols(Module).find(sym => sym.toString() === `Symbol(resolvingModule)`);
    } catch (e) {
        return null;
    }
})();

require('./common').globalCheck = false;

try {
  console.log = function () {};
  console.error = function () {};

  ['custom', 'node_parallel'].forEach(function (dir) {
    Module[RESOLUTION_STEP_KEY] = true;
    let fileNames = fs.readdirSync(path.join(__dirname, dir));
    Module[RESOLUTION_STEP_KEY] = false;
    fileNames.forEach(function (basename) {
      if (basename === 'index.js' || basename.slice(-3) !== '.js') return;
      require('./' + dir + '/' + basename);
    });
  });
} finally {
  delete console.log;
  delete console.error;
}
