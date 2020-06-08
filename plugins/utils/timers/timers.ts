export class UtilTimer {
	timer: null | any;
	time: number;
	constructor(time: number) {
		this.timer = null;
		this.time = time;
	}
	clear() {
		if (!this.timer) return;
		clearTimeout(this.timer);
		this.timer = null;
	}
	start(callback: any) {
		this.clear();
		this.timer = setTimeout(callback, this.time);
	}
}
