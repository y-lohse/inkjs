module.exports = function(grunt) {

    var babel = require('rollup-plugin-babel');
    var uglify = require('rollup-plugin-uglify');
	var exposedFiles = ['engine/Story.js'];

    // Project configuration.
    grunt.initConfig( {
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            files: ['engine/*.js'],
            tasks: ['rollup:release']
        },
        rollup: {
            options: {
				format: 'umd',
                moduleId: 'inkjs',
                moduleName: 'inkjs',
            },
			release: {
				dest: 'dist/ink-es2015.js',
                src: exposedFiles
			},
			release_min: {
				options: {
					plugins: [
						babel({
							exclude: 'node_modules/**',
							presets: ['babili'],
							comments: false
						}),
                	],
				},
				dest: 'dist/ink-es2015.min.js',
                src: exposedFiles
			},
			legacy: {
				options: {
					plugins: [
						babel({
							exclude: 'node_modules/**',
							presets: ['es2015-rollup'],
							plugins: ['transform-object-assign'],
						}),
                	],
				},
				dest: 'dist/ink.js',
                src: exposedFiles
			},
			legacy_min: {
				options: {
					plugins: [
						babel({
							exclude: 'node_modules/**',
							presets: ['es2015-rollup'],
							plugins: ['transform-object-assign'],
						}),
						uglify(),
                	],
				},
				dest: 'dist/ink.min.js',
                src: exposedFiles
			}
        },
		jasmine_node: {
        	options: {
				specFolders: ['tests/']
			},
        	all: [],
        },
    });

    // Load the plugin that provides tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-rollup');
    grunt.loadNpmTasks('grunt-jasmine-node');

    // Default task(s).
    grunt.registerTask('default', ['rollup']);
    grunt.registerTask('test', ['rollup:cjs', 'jasmine_node']);
};
