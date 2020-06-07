'use strict';

const Bins = require('./index');
let getLink = '';
test('Upload a link', () => {
	Bins.upload('Test', (r, link) => {
		if (r) {
			expect(typeof link).toBe('string');
			getLink = link;
		}
	});
});
test('Link is defined!', () => {
	expect(typeof getLink).toBe('string');
});
test('Download a link', () => {
	let splitLink = getLink.split('/');
	Bins.download(splitLink[1], data => {
		expect(data).toBeDefined();
	});
});
