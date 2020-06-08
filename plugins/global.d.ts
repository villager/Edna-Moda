
import * as PluginsType from './index';
import * as ChatType from '../servers/chat';

declare global {
    namespace NodeJS {
        interface Global {
            Plugins:any,
            Chat: any,
            toId(input: string): string,
        }
    }
    interface AnyObject {[k:string]: any}
    const Chat: typeof ChatType;
    const Config: ConfigType
    const Plugins: typeof PluginsType;
	const splint: typeof Plugins.Utils.splint;
    const toUserName: typeof Plugins.Utils.toUserName;
	const toId: typeof Plugins.Utils.toId;
}