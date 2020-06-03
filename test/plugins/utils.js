"use strict";

const assert = require("assert");

describe("Plugins", () => {
    describe("Utils", () => {
        describe("toId", () => {
            it("Should return an Id", () => {
                assert(Plugins.Utils.toId("Test") === "test");
                assert(Plugins.Utils.toId({id: "Test"}) === "test");
            });
        });
        describe("splint", () => {
            it("Should return an Array", () => {
                let target = "Hello, this, is a test";
                assert(Plugins.Utils.splint(target)[0] === "Hello");
            });
        });
    });
    describe("Language ", () => {
        describe("Load", () => {
            it("Should return an string", () => {
                let Language = Plugins.Language.load();
                assert(Language.get('english', "test") === "Test");
                assert(Language.get('spanish', "test") === "Prueba");
            });
        });
    });
    describe("Dex", () => {
        describe('getTemplate', () => {
            it("Should return a object", () => {
                assert(Plugins.Dex.getTemplate(toId("Gardevoir")).name === "Gardevoir");
            });
        });
        describe('getMove', () => {
            it('should return a object', () => {
                assert(typeof Plugins.Dex.getMove('Tackle') === "object");
            });
        });
        describe('getItem', () => {
            it('should return an object',  () => {
                assert(typeof Plugins.Dex.getItem('Choice Scarf') === "object");
            });
        });
        describe('getAbility', function () {
            it('should return an object',  () => {
                assert(typeof Plugins.Dex.getAbility('Intimidate') === "object");
            });
        });
    });
});