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
            it("Should return a Pokemon", () => {
                assert(Plugins.Dex.getTemplate("Gardevoir").name === "Gardevoir");
            });
        });
        describe('getMove', () => {
            it('should return a move', () => {
                assert(Plugins.Dex.getMove('Tackle').name === "Tackle");
            });
        });
        describe('getItem', () => {
            it('should return an item',  () => {
                assert(Plugins.Dex.getItem('Choice Scarf').name === "Choice Scarf");
            });
        });
        describe('getAbility', function () {
            it('should return an ability',  () => {
                assert(Plugins.Dex.getAbility('Intimidate').name === "Intimidate");
            });
        });
    });
});