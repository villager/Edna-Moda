var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

e.on('eventOne', function () {
	this.env('key', 42);
});
e.emit('eventOne');

assert.equal(e._data._env['key'], 42);
assert.equal(e.env('key'), 42);

e.flush();
assert.throws(e.env.bind(e, 'key'), Error);
assert.throws(function () {e._data._env['key']}, Error);
assert.throws(function () {e._data._env}, Error);

assert.throws(e.flush.bind(e));

e.on('eventTwo', function () {
	this.env('key2', 7);
});
e.emit('eventTwo');

assert.equal(e._data._env['key'], undefined);
assert.equal(e.env('key'), undefined);
assert.equal(e._data._env['key2'], 7);
assert.equal(e.env('key2'), 7);

e.flush();
assert.throws(e.env.bind(e, 'key'), Error);
assert.throws(e.env.bind(e, 'key2'), Error);
assert.throws(function () {e._data._env['key']}, Error);
assert.throws(function () {e._data._env['key2']}, Error);
assert.throws(function () {e._data._env}, Error);
