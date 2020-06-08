
import * as HastebinPath from './hastebin';

import * as PastiePath from './pastie';

export const Hastebin = HastebinPath;
export const Pastie = PastiePath;

export function upload(toUpload: string, callback: any) {
	try {
		HastebinPath.upload(toUpload, callback);
	} catch (e) {
		PastiePath.upload(toUpload, callback);
	}
}
export function download(key: string, callback: any) {
	try {
		HastebinPath.download(key, callback);
	} catch (e) {
		PastiePath.download(key, callback);
	}
}