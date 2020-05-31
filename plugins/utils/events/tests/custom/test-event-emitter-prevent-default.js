var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

e.on('baseEvent', function () {
	this.preventDefault();
});
e.emit('baseEvent');

assert.equal(e.isDefaultPrevented(), true);
assert.equal(e.env('defaultPrevented'), true);

e.on('parentEvent', function () {
	this.emit('baseEvent');
	assert.equal(e.isDefaultPrevented(), true);
	this.flush();
});
e.on('grandParentEvent', function () {
	this.emit('parentEvent');
	assert.equal(e.isDefaultPrevented(), false);
	this.flush();
});

e.emit('grandParentEvent');
assert.equal(e.isDefaultPrevented(), false);
e.flush();
