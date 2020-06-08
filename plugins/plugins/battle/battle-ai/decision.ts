/**
 * Decision maker
 */

export class MoveDecision {
	moveId: string;
	zmove: Boolean | string;
	readonly type: string;
	mega: string | Boolean;
	move: string;
	ultra: string | Boolean;
	target: any;
	constructor(moveId, target, mega, move, zmove?, ultra?) {
		this.type = 'move';
		this.move = move || 'struggle';
		this.moveId = moveId || 0;
		this.mega = mega || false;
		this.zmove = zmove || false;
		this.ultra = ultra || false;
		this.target = target;
	}
}

export class SwitchDecision {
	readonly type: string;
	poke: string | any;
	pokeId: number;
	constructor(pokeId, poke) {
		this.type = 'switch';
		this.poke = poke || 'pikachu';
		this.pokeId = pokeId || 0;
	}
}

export class TeamDecision {
	readonly type: string;
	team: number[];
	constructor(team) {
		this.type = 'team';
		this.team = team || [0, 1, 2, 3, 4, 5];
	}
}
export class PassDecision {
	readonly type: string;
	constructor() {
		this.type = 'pass';
	}
}

export class ShiftDecision {
	readonly type: string;
	constructor() {
		this.type = 'shift';
	}
}

export function isTooFar(battle: any, a:number, b:number) {
	if (battle.gametype === 'triples') {
		return (a === 0 && b === 0) || (a === 2 && b === 2);
	} else {
		return false;
	}
}

export function combinateTeamPreview(array: any, i: number, values: any, solutions: any) {
	if (i >= array.length) {
		solutions.push(array.slice());
		return;
	}
	for (let j = 0; j < values.length; j++) {
		if (array.indexOf(values[j]) >= 0) continue; //Repeated
		array[i] = values[j];
		combinateTeamPreview(array, i + 1, values, solutions);
		array[i] = -1;
	}
}

export function generateTeamCombinations(sideLength: number, requiredLength: number) {
	let comb = [];
	let values = [];
	let array = [];
	for (let i = 0; i < sideLength; i++) {
		values.push(i);
	}
	for (let i = 0; i < requiredLength; i++) {
		array.push(-1);
	}
	combinateTeamPreview(array, 0, values, comb);
	return comb;
}

export function validateDecision(des: any[]) {
	let megaConsumed = false;
	let ultraConsumed = false;
	let zMoveConsumed = false;
	let shiftConsumed = false;
	let passed = true;
	let switched = [];
	for (let i = 0; i < des.length; i++) {
		if (des[i].mega) {
			if (megaConsumed) return false; // 2 mega evolutions at the same time
			megaConsumed = true;
		}
		if (des[i].ultra) {
			if (ultraConsumed) return false; // 2 ultra burst at the same time
			ultraConsumed = true;
		}
		if (des[i].zmove) {
			if (zMoveConsumed) return false; // Only one z-move per battle
			zMoveConsumed = true;
		}
		if (des[i].type === 'switch') {
			if (switched.indexOf(des[i].pokeId) >= 0) return false; // Switch to the same pokemon
			switched.push(des[i].pokeId);
		} else if (des[i].type === 'shift') {
			if (shiftConsumed) return false; // 2 shifts at the same time
			shiftConsumed = true;
		}
		if (des[i].type !== 'pass') passed = false;
	}
	if (passed) return false; // You can"t pass the turn
	return true;
}

export function nextCombinationDecision(array:any, i: number, tables: any[], solutions: any) {
	if (i >= array.length) {
		//validate combinational decision
		if (!validateDecision(array)) return;
		//add it
		solutions.push(array.slice());
		return;
	}
	for (let j = 0; j < tables[i].length; j++) {
		array[i] = tables[i][j];
		nextCombinationDecision(array, i + 1, tables, solutions);
	}
}

export function cartesianProduct(tables: any) {
	let array = [];
	let comb = [];
	for (let i = 0; i < tables.length; i++) array.push(null);
	nextCombinationDecision(array, 0, tables, comb);
	return comb;
}

export function getDecisions(battle: any) {
	let res = [];
	let req = battle.request;
	if (!req) return null;
	if (req.wait) return null; // Nothing to do
	if (req.teamPreview) {
		/* Team required */
		let n = 1;
		if (battle.gametype === 'doubles') n = 2;
		else if (battle.gametype === 'triples') n = 3;
		let comb = generateTeamCombinations(req.side.pokemon.length, n);
		for (let i = 0; i < comb.length; i++) {
			res.push([new TeamDecision(comb[i])]);
		}
	} else if (req.forceSwitch) {
		let fw = req.forceSwitch;
		let tables = [];
		let toSw, canSw;
		toSw = 0;
		for (let i = 0; i < fw.length; i++) if (fw[i]) toSw++;
		for (let i = 0; i < fw.length; i++) {
			tables.push([]);
			if (!fw[i]) {
				tables[i].push(new PassDecision());
			} else {
				canSw = 0;
				for (let k = 0; k < req.side.pokemon.length; k++) {
					if (req.side.pokemon[k].condition === '0 fnt') continue; // Fainted
					if (req.side.pokemon[k].active) continue; // Active
					canSw++;
					tables[i].push(new SwitchDecision(k, req.side.pokemon[k].ident));
				}
				if (canSw < toSw) {
					tables[i].push(new PassDecision());
				}
			}
		}
		res = cartesianProduct(tables);
	} else if (req.active) {
		let tables = [];
		for (let i = 0; i < req.active.length; i++) {
			tables.push([]);
			if (req.side.pokemon[i].condition === '0 fnt') {
				//fainted, pass
				tables[i].push(new PassDecision());
				continue;
			}
			let active = req.active[i];
			let auxHasTarget;
			//moves
			for (let j = 0; j < active.moves.length; j++) {
				if (active.moves[j].disabled || active.moves[j].pp === 0) continue; // No more moves
				let mega = false;
				if (active.canMegaEvo || (req.side.pokemon[i] && req.side.pokemon[i].canMegaEvo)) mega = true;
				if (!active.moves[j].target) {
					// No need to set the target
					if (mega) tables[i].push(new MoveDecision(j, null, true, active.moves[j].move));
					tables[i].push(new MoveDecision(j, null, false, active.moves[j].move));
				} else if (active.moves[j].target in {any: 1, normal: 1}) {
					auxHasTarget = false;
					for (let tar = 0; tar < battle.foe.active.length; tar++) {
						if (!battle.foe.active[tar] || battle.foe.active[tar].fainted) continue; // Target not found
						if (active.moves[j].target === 'normal' && isTooFar(battle, tar, i)) continue; // Target too far
						auxHasTarget = true;
					}
					for (let tar = 0; tar < battle.foe.active.length; tar++) {
						if (auxHasTarget && (!battle.foe.active[tar] || battle.foe.active[tar].fainted)) continue; // Target not found
						if (active.moves[j].target === 'normal' && isTooFar(battle, tar, i)) continue; // Target too far
						if (mega) tables[i].push(new MoveDecision(j, tar, true, active.moves[j].move));
						tables[i].push(new MoveDecision(j, tar, false, active.moves[j].move));
					}
					for (let tar = 0; tar < battle.self.active.length; tar++) {
						if (tar === i) continue; // Not self target allowed
						if (!battle.self.active[tar] || battle.self.active[tar].fainted) continue; // Target not found
						if (active.moves[j].target === 'normal' && isTooFar(battle, tar, i)) continue; // Target too far
						if (mega) tables[i].push(new MoveDecision(j, -1 * (tar + 1), true, active.moves[j].move));
						tables[i].push(new MoveDecision(j, -1 * (tar + 1), false, active.moves[j].move));
					}
				} else if (active.moves[j].target in {adjacentAlly: 1}) {
					for (let tar = 0; tar < battle.self.active.length; tar++) {
						if (tar === i) continue; // Not self target allowed
						if (!battle.self.active[tar] || battle.self.active[tar].fainted) continue; // Target not found
						if (active.moves[j].target === 'normal' && isTooFar(battle, tar, i)) continue; // Target too far
						if (mega) tables[i].push(new MoveDecision(j, -1 * (tar + 1), true, active.moves[j].move));
						tables[i].push(new MoveDecision(j, -1 * (tar + 1), false, active.moves[j].move));
					}
				} else {
					// No need to set the target
					if (mega) tables[i].push(new MoveDecision(j, null, true, active.moves[j].move));
					tables[i].push(new MoveDecision(j, null, false, active.moves[j].move));
				}
			}
			//switchs
			if (!active.trapped) {
				for (let k = 0; k < req.side.pokemon.length; k++) {
					if (req.side.pokemon[k].condition === '0 fnt') continue; // Fainted
					if (req.side.pokemon[k].active) continue; // Active
					tables[i].push(new SwitchDecision(k, req.side.pokemon[k].ident));
				}
			}
			//shifts
			if (req.active.length === 3) {
				if (i === 0 || i === 2) tables[i].push(new ShiftDecision());
			}
		}
		res = cartesianProduct(tables);
	}
	return res;
}