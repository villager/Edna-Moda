import {Plugins as PluginsType} from './index';
import {Parser as PSParser} from '../servers/showdown/parser';
import {Parser as DiscordParser} from '../servers/discord/parser';
import {Room as PSRoom} from '../servers/showdown/rooms';
import {ChannelManager, User} from 'discord.js';
import {Monitor as MonitorType} from '../lib/monitor';
import {Bot as BotType} from '../servers/bot';
declare global {
	namespace NodeJS {
		interface Global {
			Plugins: any;
			toId(input: string): string;
			Monitor: any;
			Bot: any;
		}
	}
	interface AnyObject {
		[k: string]: any;
	}
	type ChatHandler = (
		this: PSParser | DiscordParser,
		target: string,
		room: string | PSRoom | ChannelManager,
		user: string | User,
		message: string,
	) => void;

	interface ChatCommands {
		[k: string]: ChatHandler | string | string[] | true | ChatCommands;
	}
	const Config: ConfigType;
	const Bot: typeof BotType;
	const Monitor: typeof MonitorType;
	const Plugins: typeof PluginsType;
	const splint: typeof Plugins.Utils.splint;
	const toUserName: typeof Plugins.Utils.toUserName;
	const toId: typeof Plugins.Utils.toId;
}
