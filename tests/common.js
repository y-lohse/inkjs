let path = require('path');

let rootDir = path.join(__dirname, '..');
let inkPath = path.join(rootDir, 'engine', 'runtime.js');

if (process.env.INK_TEST === "dist") {
	inkPath = path.join(rootDir, 'dist', 'ink-es2015.js');
} else if (process.env.INK_TEST === "legacy") {
	inkPath = path.join(rootDir, 'dist', 'ink.js');
}

let baselinePath = path.join(rootDir, 'tests', 'inkfiles', 'compiled');

let fs = require('fs'),
	inkjs = require(inkPath);

function loadInkFile(filename, category) {
	filename = filename + '.ink.json';

	if (category) {
		filePath = path.join(baselinePath, category, filename);
	} else {
		filePath = path.join(baselinePath, filename);
	}

	let content = fs.readFileSync(filePath, 'UTF-8')
					.replace(/^\uFEFF/, ''); // Strip the BOM.

	return new inkjs.Story(content);
}

module.exports = {
	loadInkFile: loadInkFile,
	inkjs: inkjs
};
