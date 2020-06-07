interface ConfigType {
	name: string;
	testMode: boolean;
	triggers: string[];
	servers: AnyObject;
	[k: string]: any;
}
import {DiscordClient as DiscordType} from './discord';
import {PSClient as PSClientType} from './showdown';
import * as PluginsType from '../plugins';
import * as ChatType from './chat';
import * as MonitorType from '../lib/monitor';
import * as TypeBot from './bot';

declare global {
	namespace NodeJS {
		interface Global {
			Config: ConfigType;
			Server: any;
			Monitor: any;
			toId(input: any): string;
			toUserName(input:any): string;
			splint(target: string, param?: string, len?: number): string[];
			Plugins: any;
			Chat: any;
			Bot: any;
		}
	}
	interface AnyObject {
		[k: string]: any;
	}
	const PS: typeof PSClientType;
	const DC: typeof DiscordType;
	const Config: ConfigType;
	const Plugins: typeof PluginsType;
	const Chat: typeof ChatType;
	const toId: typeof Plugins.Utils.toId;
	const Monitor: typeof MonitorType;
	const splint: typeof Plugins.Utils.splint;
	const toUserName: typeof Plugins.Utils.toUserName;
	const Bot: typeof TypeBot;
}
