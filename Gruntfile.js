module.exports = function(grunt) {

    var version = 0.1;

    var babel = require('rollup-plugin-babel');
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
                    babel({ exclude: 'node_modules/**' }),
                ],
                moduleId: 'inkjs',
                moduleName: 'inkjs',
            },
			amd: {
                options : { format: 'amd' },
                dest: 'dist/ink.amd.js',
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
    });

    // Load the plugin that provides tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-rollup');

    // Default task(s).
    grunt.registerTask('default', ['rollup']);
};
