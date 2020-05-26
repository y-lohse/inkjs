import * as path from 'path';
import * as fs from 'fs';
import {Story} from '../../engine/Story';

let baselinePath = path.join(getRootDir(), 'tests', 'inkfiles', 'compiled');

export function loadInkFile(filename: string, category: string) {
	filename = filename + '.ink.json';

	let filePath: string;
	if (category) {
		filePath = path.join(baselinePath, category, filename);
	} else {
		filePath = path.join(baselinePath, filename);
	}

	let content = fs.readFileSync(filePath, 'UTF-8').replace(/^\uFEFF/, ''); // Strip the BOM.

	let inkPath = getInkPath();
	if (inkPath) { // inkPath -> loading distributable file.
		// tslint:disable:next-line no-var-requires
		let inkjs = require(inkPath);
		return new inkjs.Story(content) as Story;
	} else { // No inkPath -> it's intended to be run through ts-node.
		return new Story(content);
	}
}

export function getInkPath() {
	if (process.env.INK_TEST === 'dist') {
		return path.join(getRootDir(), 'dist', 'ink-es2015.js');
	} else if (process.env.INK_TEST === 'legacy') {
		return path.join(getRootDir(), 'dist', 'ink.js');
	} else {
		return; // No ENV, so no inkPath.
	}
}

function getRootDir() {
	if (process.env.INK_TEST === 'dist' || process.env.INK_TEST === 'legacy') {
		return path.join(__dirname, '..', '..');
	} else {
		return path.join(__dirname, '..', '..', '..');
	}
}
