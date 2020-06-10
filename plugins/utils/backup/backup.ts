import * as path from 'path';

class Backup {
	file: string;
	name: string;
	constructor(file: string) {
		this.file = file;
		this.name = path.basename(this.file).replace(path.extname(this.file), '');
	}
	get dir() {
		return path.resolve(`./backups/${this.name}.bak`);
	}
	on() {
		Plugins.FS(this.file)
			.read('utf-8')
			.then((data: any) => {
				Plugins.FS(this.dir)
					.write(data)
					.then(() => {})
					.catch(e => Monitor.log(e));
			})
			.catch((e: any) => Monitor.log(e));
	}
	load(obj) {}
}

export const UtilBackup = (file: string) => {
	return new Backup(file);
};
