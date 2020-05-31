"use strict";


class Room {
    constructor(room, options = {}) {
        this.id = toId(room);
        this.type = options.type || 'chat';
        this.users = {};
        this.title = room
        this.userCount = 0;
        this.language = false;
    }
    updateTitle(title) {
        this.title = title;
    }
    updateUsers(users) {
        for (const user of users) {
            if(!toId(user)) continue;
            this.users[toId(user)] = toId(user);
        }
        this.userCount = Object.keys(this.users).length;
    }
    saveRooms () {
        this.chatRooms
    }
}
module.exports = Room;