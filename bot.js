

const PSBot = require('./showdown');
const DiscordBot = require('./discord');

global.Config = require('./config/config');

if(Config.servers['id1']) throw Error('Edit your config!');

global.Monitor = require('./lib/monitor');

global.Tools = require('./tools');

global.toId = Tools.toId;
global.splint = Tools.splint;
global.toUserName = Tools.toUserName;

global.Chat = require('./chat');

let bots = Object.create(null);

global.Plugins = require('./plugins');
Plugins.init();
let listeners = (Object.keys(Config.servers).length + 1) * Object.keys(Plugins.plugins).length;
Plugins.eventEmitter.setMaxListeners(listeners);
global.Discord = null

class GBot {
    constructor() {
        if(Config.token && Config.name) {
            this.discord = Discord = new DiscordBot();
        }
        this.servers = Object.create(null);
        for (let i in Config.servers) {
            let Server = Config.servers[i];
            this.servers[i] = bots[i] = new PSBot(Server);

        }
    }
    checkConnectivity() {
        for (let i in Config.servers) {
            let Server = Config.servers[i];
            console.log('Config '+ this.servers[i]);
            if(!this.servers[i]) {
                console.log('Reconectando a ' + i);
                this.servers[i] = bots[i] = new PSBot(Server);
                this.servers[i].connect();
                Server.connection.on('message', () => {
                    Chat.loadPlugins();
                });
            }
        }
    }
    connect() {
        for (let i in this.servers) {
            let Server = this.servers[i];
            Server.connect();
            Chat.loadPlugins();
        }
        if(this.discord) this.discord.connect();
    }
}
const GlobalBot = global.GlobalBot = new GBot ();

GlobalBot.connect();
/**
 * Verificar el Status del Bot cada 5 minutos
 */

function getBot(bot) {
    if(!bots[bot]) return false;
    return bots[bot];
}
global.Bot = getBot;

Bot.bots = bots;

Bot.forEach = function(callback, thisArg) {
    Object.values(bots).forEach(callback, thisArg);
};
setTimeout(() => {
    console.log(Object.assign(Discord.commands));
}, 1000 * 5)