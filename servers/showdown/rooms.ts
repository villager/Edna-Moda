export class Room {
	id: string;
	type: string;
	users: any;
	title: string;
	userCount: number;
	language: Boolean | string;
	constructor(room: string, options: any = {}) {
		this.id = toId(room);
		this.type = options.type || 'chat';
		this.users = {};
		this.title = room;
		this.userCount = 0;
		this.language = false;
	}
	updateTitle(title: string) {
		this.title = title;
	}
	updateUsers(users: string[]) {
		for (const user of users) {
			if (!toId(user)) continue;
			this.users[toId(user)] = toId(user);
		}
		this.userCount = Object.keys(this.users).length;
	}
	saveRooms() {}
}
