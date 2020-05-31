var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

e.on('eventOne', function () {
	this.data('key', 42);
});
e.emit('eventOne');

assert.equal(e._data['key'], 42);
assert.equal(e.data('key'), e._data['key']);
e.flush();

e.on('eventTwo', function () {
	this.data('key2', 7);
});
e.emit('eventTwo');

assert.equal(e._data['key'], undefined);
assert.equal(e.data('key'), undefined);
assert.equal(e._data['key2'], 7);
assert.equal(e.data('key2'), 7);

e.flush();
assert.strictEqual(e._data, null);
assert.strictEqual(e._stack.length, 1);

e.on('childEventOne', function () {
	assert.notEqual(e._data['key2'], 7);
	assert.notEqual(e._data['key2'], 8);
	this.data('key2', 7);
	assert.equal(e._data['key2'], 7);
});

e.on('parentEventOne', function () {
	assert.notEqual(e._data['key2'], 8);
	this.data('key2', 8);
	assert.equal(e._data['key2'], 8);
	e.emit('childEventOne');
	assert.equal(e._data['key2'], 7);
	e.flush();
});

e.emit('parentEventOne');
assert.equal(e._data['key2'], 8);
e.flush();

assert.strictEqual(e._data, null);
assert.strictEqual(e._stack.length, 1);

e.on('complexEventOne', function () {
	this.data('key', 'value1');
});
e.on('complexEventOne', function () {
	this.data('key', 'value2');
});
e.emit('complexEventOne', 1, 2, 3, 4, 5);
assert.equal(e.data('key'), 'value2');
assert.equal(e.data('key'), 'value2');

assert.notStrictEqual(e._stack.length,1);
e.flush();

assert.strictEqual(e._data, null);
assert.strictEqual(e._stack.length, 1);

/* Failing test !! */
e.on('subEventOne', function () {

});
e.on('subEventTwo', function () {
	this.data('DataEntry', 'some_fancy_data');
});

e.on('complexEventTwo', function () {
	var data = e._data;

	e.emit('subEventOne');
	assert.notStrictEqual(data, e._data);
	e.flush();
	assert.strictEqual(data, e._data);

	e.emit('subEventTwo');
	assert.notStrictEqual(data, e._data);

	var retrievedData = e.getData().DataEntry;
	assert.strictEqual(retrievedData, 'some_fancy_data');
	assert.strictEqual(data, e._data);

	e.data('dataEntry', 42);
	assert.equal(data, e._data);
	e.data('DataEntry', 43);
	assert.equal(data, e._data);

	assert.notStrictEqual(e.data('dataEntry'), e.data('DataEntry'));
	assert.strictEqual(e._stack.length, 2);
});

e.emit('complexEventTwo');
assert.strictEqual(e.data('DataEntry'), 43);
assert.strictEqual(e._stack.length, 2);
e.flush();
assert.strictEqual(e._stack.length, 1);

assert.throws(e.data.bind(e, 'customKey'));
assert.throws(e.data.bind(e, 'customKey', 7));
