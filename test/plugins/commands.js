"use strict";

const fs = require("fs");
const assert = require("assert");

describe("Commands", () => {
    describe("Load", () => {
        let pluginList = fs.readdirSync("./plugins/plugins/");
        it("pluginList should be an array", () => {
            assert(Array.isArray(pluginList) === true);
        });
        it("Should not crash when it loads", () => {
            pluginList.forEach(plugin => {
                Plugins.load(plugin);
            });
        });
        it("Should not crash when it assign each command", () => {
            Plugins.loadPlugins();
        });
    });
});