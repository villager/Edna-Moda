"use strict";Object.defineProperty(exports, "__esModule", {value: true});/**
 * Random Decision
 */

'use strict';

 function setup (Data) {
	const BattleModule = {};
	BattleModule.id = "random";

	BattleModule.decide = function (battle, decisions) {
		return decisions[Math.floor(Math.random() * decisions.length)];
	};

	return BattleModule;
} exports.setup = setup;