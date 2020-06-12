// Copyright Node.js contributors. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

// This license applies to parts of Node.js originating from the
// https://github.com/joyent/node repository:
//
// Copyright Joyent, Inc. and other Node contributors. All rights reserved.
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.

export function EventEmitter() {
	EventEmitter.init.call(this);
}

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

EventEmitter.init = function () {
	if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
		this._events = {};
		this._eventsCount = 0;
	}

	this._maxListeners = this._maxListeners || undefined;
	this._stack = [null];
};

EventEmitter.prototype._stack = null; // Array
EventEmitter.prototype._data = null;
EventEmitter.prototype.event = '';
EventEmitter.prototype.parentEvent = '';

EventEmitter.prototype._getEvent = function () {
	let stackEntry = getStackEntry(this._stack, -1);

	if (stackEntry === null) return '';

	return stackEntry._env.eventType;
};

EventEmitter.prototype._getParentEvent = function () {
	let stackEntry = getStackEntry(this._stack, -2);

	if (stackEntry === null) return '';

	return stackEntry._env.eventType;
};

EventEmitter.prototype._popStack = function () {
	this._stack.pop();
	this._data = getStackEntry(this._stack, -1);
	this.event = this.parentEvent;
	this.parentEvent = this._getParentEvent();
};

EventEmitter.prototype._pushStack = function (data) {
	if (this._stack.push(data) >= 8) {
		console.error.apply(console, getStackLeakError(this._stack));
		console.trace();
	}
};

// EventEmitter#getData, EventEmitter#flush, and EventEmitter#end
// have the exact same side effects, but different return values.

EventEmitter.prototype.getData = function () {
	if (!this._data)
		// Missing EventEmitter#emit call
		throw new Error('Bad access to EventEmitter data');

	let data = this._data;
	this._popStack();
	return data;
};

// This looks streamy... hmmm

EventEmitter.prototype.flush = function () {
	if (!this._data)
		// Missing EventEmitter#emit call
		throw new Error('Bad call to EventEmitter#flush');

	this._popStack();
	return this;
};

EventEmitter.prototype.end = function (value) {
	if (!this._data)
		// Missing EventEmitter#emit call
		throw new Error('Bad call to EventEmitter#end');

	this._popStack();
	return value;
};

EventEmitter.prototype.data = function (key, value) {
	if (!this._data)
		// Not initialized yet
		throw new Error('Bad access to EventEmitter data');

	if (arguments.length < 2) return this._data[key];

	this._data[key] = value;

	return this;
};

EventEmitter.prototype.env = function (key, value) {
	if (!this._data)
		// Missing EventEmitter#emit call
		throw new Error('Bad access to EventEmitter environment');

	if (arguments.length < 2) return this._data._env[key];

	this._data._env[key] = value;

	return this;
};

EventEmitter.prototype.preventDefault = function () {
	this.env('defaultPrevented', true);
	return this;
};

EventEmitter.prototype.isDefaultPrevented = function () {
	return !!this.env('defaultPrevented');
};

EventEmitter.prototype.hadListeners = function () {
	return !!this.env('hadListeners');
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
	if (typeof n !== 'number' || n < 0 || isNaN(n)) throw new TypeError('n must be a positive number');
	this._maxListeners = n;
	return this;
};

function $getMaxListeners(that) {
	if (that._maxListeners === undefined) return EventEmitter.defaultMaxListeners;
	return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
	return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a letiable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
	if (isFn) handler.call(self);
	else {
		let len = handler.length;
		let listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self);
	}
}
function emitOne(handler, isFn, self, arg1) {
	if (isFn) handler.call(self, arg1);
	else {
		let len = handler.length;
		let listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1);
	}
}
function emitTwo(handler, isFn, self, arg1, arg2) {
	if (isFn) handler.call(self, arg1, arg2);
	else {
		let len = handler.length;
		let listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2);
	}
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
	if (isFn) handler.call(self, arg1, arg2, arg3);
	else {
		let len = handler.length;
		let listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].call(self, arg1, arg2, arg3);
	}
}

function emitMany(handler, isFn, self, args) {
	if (isFn) handler.apply(self, args);
	else {
		let len = handler.length;
		let listeners = arrayClone(handler, len);
		for (let i = 0; i < len; ++i) listeners[i].apply(self, args);
	}
}

EventEmitter.prototype.emit = function emit(type) {
	if (!type) throw new Error('Unspecified event');

	let er, err, handler, len, args, i, events;
	let doError = type === 'error';

	this._data = new DataEntry(type);
	this._pushStack(this._data);
	this.event = type;
	this.parentEvent = this._getParentEvent();

	events = this._events;
	if (events) {
		doError = doError && events.error === null;
		this.env('hadListeners', true);
	} else if (!doError) return this;

	// If there is no "error" event listener then throw.
	if (doError) {
		if (!arguments.length) {
			err = new Error(`Uncaught, undefined "error" event.`);
			err.context = undefined;
			throw err;
		} else {
			er = arguments[1];
			if (er instanceof Error) {
				throw er; // Unhandled "error" event
			} else {
				// At least give some kind of context to the user
				err = new Error(`Uncaught, unspecified "error" event. ${' + er + '}`);
				err.context = er;
				throw err;
			}
		}
	}

	handler = events[type];

	if (!handler) return this;

	let isFn = typeof handler === 'function';
	len = arguments.length;
	switch (len) {
		// fast cases
		case 1:
			emitNone(handler, isFn, this);
			break;
		case 2:
			emitOne(handler, isFn, this, arguments[1]);
			break;
		case 3:
			emitTwo(handler, isFn, this, arguments[1], arguments[2]);
			break;
		case 4:
			emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
			break;
		// slower
		default:
			args = new Array(len - 1);
			for (i = 1; i < len; i++) args[i - 1] = arguments[i];
			emitMany(handler, isFn, this, args);
	}

	return this;
};

EventEmitter.prototype.addListener = function addListener(type, listener) {
	let m;
	let events;
	let existing;

	if (typeof listener !== 'function') throw new TypeError('listener must be a function');

	events = this._events;
	if (!events) {
		events = this._events = {};
		this._eventsCount = 0;
	} else {
		// To avoid recursion in the case that type === "newListener"! Before
		// adding it to the listeners, first emit "newListener".
		if (events.newListener) {
			this.emit('newListener', type, listener.listener ? listener.listener : listener);

			// Re-assign `events` because a newListener handler could have caused the
			// this._events to be assigned to a new object
			events = this._events;
		}
		existing = events[type];
	}

	if (!existing) {
		// Optimize the case of one listener. Don"t need the extra array object.
		existing = events[type] = listener;
		++this._eventsCount;
	} else {
		if (typeof existing === 'function') {
			// Adding the second element, need to change to array.
			existing = events[type] = [existing, listener];
		} else {
			// If we"ve already got an array, just append.
			existing.push(listener);
		}

		// Check for listener leak
		if (!existing.warned) {
			m = $getMaxListeners(this);
			if (m && m > 0 && existing.length > m) {
				existing.warned = true;
				console.error(
					'(node) warning: possible EventEmitter memory ' +
						'leak detected. %d %s listeners added. ' +
						'Use emitter.setMaxListeners() to increase limit.',
					existing.length,
					type,
				);
				console.trace();
			}
		}
	}

	return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function once(type, listener) {
	if (typeof listener !== 'function') throw new TypeError('listener must be a function');

	let fired = false;

	function g() {
		this.removeListener(type, g);

		if (!fired) {
			fired = true;
			listener.apply(this, arguments);
		}
	}

	g.listener = listener;
	this.on(type, g);

	return this;
};

// emits a "removeListener" event iff the listener was removed
EventEmitter.prototype.removeListener = function removeListener(type, listener) {
	let list, events, position, i;

	if (typeof listener !== 'function') throw new TypeError('listener must be a function');

	events = this._events;
	if (!events) return this;

	list = events[type];
	if (!list) return this;

	if (list === listener || (list.listener && list.listener === listener)) {
		if (--this._eventsCount === 0) this._events = {};
		else {
			delete events[type];
			if (events.removeListener) this.emit('removeListener', type, listener);
		}
	} else if (typeof list !== 'function') {
		position = -1;

		for (i = list.length; i-- > 0; ) {
			if (list[i] === listener || (list[i].listener && list[i].listener === listener)) {
				position = i;
				break;
			}
		}

		if (position < 0) return this;

		if (list.length === 1) {
			list[0] = undefined;
			if (--this._eventsCount === 0) {
				this._events = {};
				return this;
			} else {
				delete events[type];
			}
		} else {
			spliceOne(list, position);
		}

		if (events.removeListener) this.emit('removeListener', type, listener);
	}

	return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(type) {
	let listeners, events;

	events = this._events;
	if (!events) return this;

	// not listening for removeListener, no need to emit
	if (!events.removeListener) {
		if (arguments.length === 0) {
			this._events = {};
			this._eventsCount = 0;
		} else if (events[type]) {
			if (--this._eventsCount === 0) this._events = {};
			else delete events[type];
		}
		return this;
	}

	// emit removeListener for all listeners on all events
	if (arguments.length === 0) {
		let keys = Object.keys(events);
		for (let i = 0, key; i < keys.length; ++i) {
			key = keys[i];
			if (key === 'removeListener') continue;
			this.removeAllListeners(key);
		}
		this.removeAllListeners('removeListener');
		this._events = {};
		this._eventsCount = 0;
		return this;
	}

	listeners = events[type];

	if (typeof listeners === 'function') {
		this.removeListener(type, listeners);
	} else if (listeners) {
		// LIFO order
		do {
			this.removeListener(type, listeners[listeners.length - 1]);
		} while (listeners[0]);
	}

	return this;
};

EventEmitter.prototype.listeners = function listeners(type) {
	let evlistener;
	let ret;
	let events = this._events;

	if (!events) ret = [];
	else {
		evlistener = events[type];
		if (!evlistener) ret = [];
		else if (typeof evlistener === 'function') ret = [evlistener];
		else ret = arrayClone(evlistener, evlistener.length);
	}

	return ret;
};

EventEmitter.listenerCount = function (emitter, type) {
	if (typeof emitter.listenerCount === 'function') {
		return emitter.listenerCount(type);
	} else {
		return listenerCount.call(emitter, type);
	}
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
	const events = this._events;

	if (events) {
		const evlistener = events[type];

		if (typeof evlistener === 'function') {
			return 1;
		} else if (evlistener) {
			return evlistener.length;
		}
	}

	return 0;
}

// Helper constructors
function EnvironmentEntry(type) {
	this.eventType = type;
}
EnvironmentEntry.prototype = Object.create(null, {
	constructor: {
		value: EnvironmentEntry,
		enumerable: false,
		writable: true,
		configurable: true,
	},
	hadListeners: {
		value: false,
		enumerable: false,
		writable: true,
		configurable: true,
	},
	defaultPrevented: {
		value: false,
		enumerable: false,
		writable: true,
		configurable: true,
	},
	eventType: {
		value: '',
		enumerable: false,
		writable: true,
		configurable: true,
	},
});

function DataEntry(type) {
	Object.defineProperty(this, '_env', {
		value: new EnvironmentEntry(type),
		enumerable: false,
		writable: false,
		configurable: false,
	});
}
DataEntry.prototype = Object.create(null, {
	constructor: {
		value: DataEntry,
		enumerable: false,
		writable: true,
		configurable: true,
	},
});

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
	for (let i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1) list[i] = list[k];
	list.pop();
}

function arrayClone(arr, i) {
	let copy = new Array(i);
	while (i--) copy[i] = arr[i];
	return copy;
}

function getStackEntry(stack, delta) {
	if (stack.length < -delta) return null;

	return stack[stack.length + delta];
}

function getStackLeakError(stack) {
	return [
		'(node) warning: possible EventEmitter memory ' +
			'leak detected. Stack is %d units long: %s. ' +
			'Call EventEmitter#[getData|end|flush] exactly once ' +
			'after each EventEmitter#emit call',
		stack.length,
		stack
			.map(function (entry) {
				return entry ? entry._env.eventType : '#null';
			})
			.join(', '),
	];
}
