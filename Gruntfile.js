module.exports = function(grunt) {

    var babel = require('rollup-plugin-babel');
    var uglify = require('rollup-plugin-uglify');
	var exposedFiles = ['engine/Story.js'];

    // Project configuration.
    grunt.initConfig( {
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            files: ['engine/*.js'],
            tasks: ['rollup:cjs', 'rollup:iife']
        },
        rollup: {
            options: {
                plugins: [
                    babel({
						exclude: 'node_modules/**',
						presets: ['es2015-rollup'],
						plugins: ['transform-object-assign'],
					}),
					uglify(),
                ],
                moduleId: 'inkjs',
                moduleName: 'inkjs',
            },
			amd: {
                options : { format: 'amd' },
                dest: 'dist/ink.amd.js',
                src: exposedFiles
            },
			umd: {
                options : { format: 'umd' },
                dest: 'dist/ink.umd.js',
                src: exposedFiles
            },
            cjs: {
                options : { format: 'cjs' },
                dest: 'dist/ink.cjs.js',
                src: exposedFiles
            },
			iife: {
                options : { format: 'iife' },
                dest: 'dist/ink.iife.js',
                src: exposedFiles
            },
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
