module.exports = function(grunt) {

    var version = 0.1;

    var babel = require('rollup-plugin-babel');

    // Project configuration.
    grunt.initConfig( {
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            files: ['engine/*.js'],
            tasks: ['rollup']
        },
        rollup: {
            options: {
                plugins: [
                    babel({ exclude: 'node_modules/**' }),
                ],
                moduleId: 'jsink',
                moduleName: 'jsink',
            },
            cjs: {
                options : { format: 'cjs' },
                dest: 'dist/ink.cjs.js',
                src: ['engine/Story.js']
            },
        },
        jasmine_node: {
        	options: {},
        	all: [],
        },
    });

    // Load the plugin that provides tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-rollup');

    // Default task(s).
    grunt.registerTask('default', ['rollup']);
};
