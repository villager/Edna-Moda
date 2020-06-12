var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

e.on('someevent', function () {
	this.data('key', 42);
});
assert.equal(e.emit('someevent'), e);
assert.equal(e.emit('unhandledevent'), e);
