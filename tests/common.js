var inkPath = '../engine/runtime.js'

if (process.env.INK_TEST === "dist") {
	inkPath = '../dist/ink-es2015.js'
} else if (process.env.INK_TEST === "legacy") {
	inkPath = '../dist/ink.js'
}

var inkFileBasePath = 'tests/inkfiles/';

var fs = require('fs'),
	inkjs = require(inkPath);

function loadInkFile(path){
	path = inkFileBasePath + path;

	var content = fs.readFileSync(path, 'UTF-8')
		.replace(/^\uFEFF/, '');//strip the BOM

	return new inkjs.Story(content);
};

module.exports = {
	loadInkFile: loadInkFile,
	inkjs: inkjs
};
