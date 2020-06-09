/*
 * Random Decision
 */

export function setup() {
	const BattleModule: AnyObject = {};
	BattleModule.id = 'random';

	BattleModule.decide = function (battle, decisions) {
		return decisions[Math.floor(Math.random() * decisions.length)];
	};

	return BattleModule;
}
