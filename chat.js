"use strict";

const Chat = module.exports = {};

Chat.psCommands = Object.create(null);

Chat.globalCommands = Object.create(null);

Chat.discordCommands = Object.create(null);

Chat.packageData = {};

Chat.loadPlugins = function() {  
    Tools.FS('./package.json').readTextIfExists().then(data => {
        if (data) Chat.packageData = JSON.parse(data);
    });
    Plugins.loadPlugins();

    Object.assign(Chat.discordCommands, Chat.globalCommands);
    Object.assign(Chat.psCommands, Chat.globalCommands);

};
Chat.hasAuth = function(id, user, perm) {
    let userId = id === 'discord' ? toUsername(user) : toId(user);
    for (const owner of Config.owners) {
        if(owner.id === userId) return true;
        for (const aliases of owner.aliases) {
            if(aliases === userId) return true;
        }
    }
    if(id === 'discord') {
        return true; // I'll do this latter
    } else {
        let rank = Config.permissions[perm];
        if(rank == user.group) return true; // It's equal 
        if (Config.rankList.indexOf(user.group) >= Config.rankList.indexOf(rank)) return true;            
    }
    return false;
};