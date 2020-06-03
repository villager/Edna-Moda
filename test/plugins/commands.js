"use strict";

const fs = require('fs');

describe("Commands", () => {
    describe("Load", () => {
        it("Should not crash when it loads", () => {
            fs.readdirSync('./plugins/plugins/').forEach(plugin => {
                Plugins.load(plugin);
            });
        });
        it("Should not crash when it assign each command", () => {
            Plugins.loadPlugins();
        });
    });

});