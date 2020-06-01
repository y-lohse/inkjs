#!/usr/bin/env node

// Recompile baseline ink files with the current version
// of inklecate available in $PATH.

let childProcess = require('child_process');
let glob = require("glob");
let fs = require('fs-extra');
let path = require('path');

let fileDirectory = path.join(__dirname, 'inkfiles');
let inkFileDirectory = path.join(fileDirectory, 'original');
let compiledFileDirectory = path.join(fileDirectory, 'compiled');

// These files require the `-c` flag so that all visits will
// be counted.
let filesRequiringCFlag = [
	'visit_counts_when_choosing.ink',
	'turns_since_with_variable_target.ink',
	'read_count_variable_target.ink',
	'tests.ink'
]

function runInklecate(input, output, extraArgs) {
	let command = `inklecate ${extraArgs} -o "${output}" "${input}"`

	return new Promise((resolve, reject) => {
		childProcess.exec(command, (error, stdout, stderr) => {
			if (error) {
				// Adding stdout as well, in case this is a compilation error.
				reject(new Error(`${error.message.replace(/\n+$/, "")}\n${stdout}`));
			} else {
				resolve(stdout);
			}
		});
	});
}

async function compileInkFile() {
	console.log("Compiling test cases…");

	let files = glob.sync(`${inkFileDirectory}/**/!(includes)/*.ink`);

	let promises = files.map(async (file) => {
		let out = path.join(compiledFileDirectory, path.relative(inkFileDirectory, file) + '.json');
		let fileName = path.basename(file)

		let extraArgs = '';

		if (filesRequiringCFlag.includes(fileName)) {
			extraArgs = '-c';
		}

		let outDirectory = path.dirname(out);

		await fs.ensureDir(outDirectory);
		return runInklecate(file, out, extraArgs);
	})

	let results = await Promise.allSettled(promises);
	let errors = results.filter(result => result.status === "rejected");

	if (errors.length === 0) console.log("Done.");
	else errors.forEach(error => console.error(`\n${error.reason.message}`));
}

compileInkFile();
