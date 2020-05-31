/*var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

var handlers = [];
handlers.push(function () {this.data('key', 1)});
handlers.push(function () {this.data('key', 2)});
handlers.push(function () {this.data('key', 3)});
handlers.push(function () {this.data('key', 4)});
handlers.push(function () {this.data('key', 5)});
handlers.push(function () {this.data('key', 6)});
handlers.push(function () {this.data('key', 7)});
handlers.push(function () {this.data('key', 8)});

e.on('someevent', handlers[0]);
e.on('someevent', handlers[1]);
assert.equal(e.emit('someevent').data('key'), 2);

handlers[3].priority = 1;
e.on('anotherevent', handlers[2]);
e.on('anotherevent', handlers[3]);
assert.equal(e.emit('anotherevent').data('key'), 3);
*/