#!/usr/bin/env node

// Recompile baseline ink files with the current version of inklecate avilable
// $PATH.

let childProcess = require('child_process');
let fs = require('fs-extra');
let path = require('path');

let fileDirectory = path.join(__dirname, 'files');
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

function getAllInkFiles(dir) {
	return fs.readdirSync(dir).reduce((files, file) => {
		if (fs.statSync(path.join(dir, file)).isDirectory()) {
			// 'includes' directories are not processed since they are expected
			// to be included by inklecate directly.
			if (file !== 'includes') {
				return files.concat(getAllInkFiles(path.join(dir, file)));
			} else {
				return files;
			}
		} else {
			if (path.extname(file) === '.ink') {
				return files.concat(path.join(dir, file));
			} else {
				return files;
			}
		}
	}, []);
}

function runInklecate(input, output, extraArgs) {
	let command = `inklecate ${extraArgs} -o "${output}" "${input}"`

	return new Promise((resolve, reject) => {
		childProcess.exec(command, (error, stdout, stderr) => {
			if (error) {
				reject(error);
			} else {
				resolve(stdout);
			}
		});
	});
}

function compileInkFile() {
	console.log("Compiling test cases…");

	let files = getAllInkFiles(inkFileDirectory)

	let promises = files.map((file) => {
		let out = path.join(compiledFileDirectory, path.relative(inkFileDirectory, file) + '.json');
		let fileName = path.basename(file)

		let extraArgs = '';

		if (filesRequiringCFlag.includes(fileName)) {
			extraArgs = '-c';
		}

		let outDirectory = path.dirname(out);

		return fs.pathExists(outDirectory).then(exists => {
			if (exists) {
				return runInklecate(file, out, extraArgs);
			} else {
				return fs.ensureDir(outDirectory).then(() => runInklecate(file, out, extraArgs));
			}
		})
	})

	Promise
		.allSettled(promises)
		.then(
			() => console.log("Done."),
			(errors) => errors.forEach((error) => console.log(error.message))
		);
}

compileInkFile();