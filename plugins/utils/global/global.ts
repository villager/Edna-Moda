export const GlobalUtility = new (class {
	toId(text: string | any) {
		if (text && text.username && text.id) {
			text = text.username;
		} else if (text && text.id) {
			text = text.id;
		}
		if (typeof text !== 'string' && typeof text !== 'number') return '';
		return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
	}
	toRoomId(text: string | any) {
		if (text && text.name) {
			text = text.name;
		} else if (text && text.title) {
			text = text.title;
		}
		if (typeof text !== 'string' && typeof text !== 'number') return '';
		return ('' + text).toLowerCase().replace(/[^a-z0-9]+/g, '');
	}
	toName(text: string | any) {
		if (text && text.name) {
			text = text.name;
		} else if (text && text.username) {
			text = text.username;
		}
		if (typeof text !== 'string' && typeof text !== 'number') return '';
		return text as string;
	}
	toUserName(name: string | any) {
		if (name && name.username) {
			name = name.username;
		}
		return ('' + name).toLowerCase().replace(/[^a-z0-9]+/g, '');
	}
	splint(target: string, separator?: string, length?: number): string | string[] {
		if (!separator) separator = ',';

		let cmdArr = [];
		let positions = [];
		if (length > 0) {
			for (let i = 0; i < target.length; i++) {
				if (separator === target[i]) positions.push(i);
			}
			for (let i = 0; i < positions.length; i++) {
				if (cmdArr.length + 1 === length) {
					cmdArr.push(target.slice(positions[i - 1], target.length));
					break;
				} else if (i === 0) {
					cmdArr.push(target.slice(0, positions[i]));
				} else {
					cmdArr.push(target.slice(positions[i - 1], positions[i]));
				}
			}
		} else if (length < 0) {
			let sepIndex = -1;
			for (let count = length; ; count++) {
				// jscs:ignore disallowSpaceBeforeSemicolon
				sepIndex = target.lastIndexOf(separator);
				if (count === -1) {
					cmdArr.unshift(target);
					break;
				} else if (sepIndex === -1) {
					cmdArr.unshift(target);
					break;
				} else {
					cmdArr.unshift(target.from(sepIndex + 1));
					target = target.to(sepIndex);
				}
			}
		} else {
			cmdArr = target.split(separator);
		}
		return cmdArr.map(cmd => cmd.trim());
	}
	escapeHTML(str: string | any) {
		if (!str) return '';
		return ('' + str)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/"/g, '&apos;')
			.replace(/\//g, '&#x2f;');
	}
	toDurationString(val: string | number | Date, options: AnyObject = {}) {
		// TODO: replace by Intl.DurationFormat or equivalent when it becomes available (ECMA-402)
		// https://github.com/tc39/ecma402/issues/47
		const date = new Date(+val);
		const parts = [
			date.getUTCFullYear() - 1970,
			date.getUTCMonth(),
			date.getUTCDate() - 1,
			date.getUTCHours(),
			date.getUTCMinutes(),
			date.getUTCSeconds(),
		];
		const roundingBoundaries = [6, 15, 12, 30, 30];
		const unitNames = ['second', 'minute', 'hour', 'day', 'month', 'year'];
		const positiveIndex = parts.findIndex(elem => elem > 0);
		const precision = options.precision ? options.precision : parts.length;
		if (options.hhmmss) {
			const str = parts
				.slice(positiveIndex)
				.map(value => (value < 10 ? '0' + value : '' + value))
				.join(':');
			return str.length === 2 ? '00:' + str : str;
		}
		// round least significant displayed unit
		if (positiveIndex + precision < parts.length && precision > 0 && positiveIndex >= 0) {
			if (parts[positiveIndex + precision] >= roundingBoundaries[positiveIndex + precision - 1]) {
				parts[positiveIndex + precision - 1]++;
			}
		}
		return parts
			.slice(positiveIndex)
			.reverse()
			.map((value, index) => (value ? value + ' ' + unitNames[index] + (value > 1 ? 's' : '') : ''))
			.reverse()
			.slice(0, precision)
			.join(' ')
			.trim();
	}
})();
