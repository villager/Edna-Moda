var assert = require('assert');
var events = require('../../');

var e = new events.EventEmitter();

// several events emmited from an event handler, with the same deepness

e.on('poke', function () {
	e.emit('subpoke1').flush();
	e.emit('subpoke2').flush();
	e.emit('subpoke3').flush();
	e.emit('subpoke4').flush();
});

e.on('subpoke1', function () {
	assert.equal(this.event, 'subpoke1');
	assert.equal(this.parentEvent, 'poke');
});

e.on('subpoke2', function () {
	assert.equal(this.event, 'subpoke2');
	assert.equal(this.parentEvent, 'poke');
});

e.on('subpoke3', function () {
	assert.equal(this.event, 'subpoke3');
	assert.equal(this.parentEvent, 'poke');
});

e.on('subpoke4', function () {
	assert.equal(this.event, 'subpoke4');
	assert.equal(this.parentEvent, 'poke');
});

// nested emmited events

e.on('poke2', function () {
	assert.equal(this.event, 'poke2');
	e.emit('sub2poke').flush();
});

e.on('sub2poke', function () {
	assert.equal(this.event, 'sub2poke');
	assert.equal(this.parentEvent, 'poke2');
	e.emit('sub3poke').flush();
});

e.on('sub3poke', function () {
	assert.equal(this.event, 'sub3poke');
	assert.equal(this.parentEvent, 'sub2poke');
});

// mixture of nested and un-nested events called from event handlers

e.on('poke3', function () {
	e.emit('poke').flush();
	e.emit('poke2').flush();
	e.emit('poke2').flush();
	e.emit('poke').flush();
});

e.emit('poke1').flush();
e.emit('poke2').flush();
e.emit('poke3').flush();
e.emit('poke3').flush();
