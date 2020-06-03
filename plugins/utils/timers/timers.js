"use strict";

class BotTimer {
    constructor(time) {
        this.timer = null;
        this.time = time;
    }
    clear() {
        if (!this.timer) return;
        clearTimeout(this.timer);
        this.timer = null;
    }
    start(callback) {
        this.clear();
        this.timer = setTimeout(callback, this.time);
    }
}

module.exports = BotTimer;