interface ConfigType {
	name: string;
	testMode: boolean;
	triggers: string[];
	servers: AnyObject;
	[k: string]: any;
}
import {DiscordClient as DiscordType} from './discord';
import {PSClient as PSClientType} from './showdown';
import {Plugins as PluginsType} from '../plugins';
import {Monitor as MonitorType} from '../lib/monitor';
import {Bot as TypeBot} from './bot';
import {Parser as PSParser} from './showdown/parser';
import {Parser as DiscordParser} from './discord/parser';
import {Room as PSRoom} from './showdown/rooms';
import {ChannelManager, User} from 'discord.js';

declare global {
	namespace NodeJS {
		interface Global {
			Config: ConfigType;
			Server: any;
			Monitor: any;
			Plugins: any;
			toId(input: any): string;
			toUserName(input: any): string;
			splint(target: string, param?: string, len?: number): string[];
			Chat: any;
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
	const PS: typeof PSClientType;
	const DC: typeof DiscordType;
	const Config: ConfigType;
	const Plugins: typeof PluginsType;
	const toId: typeof Plugins.Utils.toId;
	const Monitor: typeof MonitorType;
	const splint: typeof Plugins.Utils.splint;
	const toUserName: typeof Plugins.Utils.toUserName;
	const Bot: typeof TypeBot;
}
