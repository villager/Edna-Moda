import {Plugins as PluginsType} from './index';
import * as ChatType from '../servers/chat';
import {Parser as PSParser} from '../servers/showdown/parser';
import {Parser as DiscordParser} from '../servers/discord/parser';
import {Room as PSRoom} from '../servers/showdown/rooms';
import {ChannelManager, User} from 'discord.js';

declare global {
	namespace NodeJS {
		interface Global {
			Plugins: any;
			Chat: any;
			toId(input: string): string;
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
	const Chat: typeof ChatType;
	const Config: ConfigType;
	const Plugins: typeof PluginsType;
	const splint: typeof Plugins.Utils.splint;
	const toUserName: typeof Plugins.Utils.toUserName;
	const toId: typeof Plugins.Utils.toId;
}
