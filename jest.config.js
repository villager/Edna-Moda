"use strict";

module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	coverageDirectory: "coverage",
	coveragePathIgnorePatterns: ["/node_modules/", "/plugins/utils/events/"],
};
