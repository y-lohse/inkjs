module.exports = function (grunt) {

  var babel = require('rollup-plugin-babel');
  var uglify = require('rollup-plugin-uglify');
  var exposedFiles = ['engine/Story.js'];

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      dev: {
        files: ['engine/*.js'],
        tasks: ['rollup:release']
      },
      test: {
        files: ['engine/*.js', 'test/*.js', 'tests/specs/*.js', 'tests/inkfiles/*.*', 'Gruntfile.js'],
        tasks: ['rollup:release', 'test:es2015']
      }
    },
    rollup: {
      options: {
        format: 'umd',
        moduleName: 'inkjs',
        amd: {
          id: 'inkjs'
        }
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
    env: {
      es2015: {
        INK_PATH: 'dist/ink-es2015.js'
      },
      legacy: {
        INK_PATH: 'dist/ink.js'
      }
    },
    jasmine_node: {
      es2015: {
        options: {
          jasmine: {
            spec_dir: 'tests/specs',
            reporters: {
              spec: {}
            }
          },
          coverage: {
            includeAllSources: true,
            report: ['lcov', 'text-summary'],
            reportDir: 'tests/coverage'
          },
        },
        src: ['dist/ink-es2015.js']
      },
      legacy: {
        options: {
          jasmine: {
            spec_dir: 'tests/specs',
            reporters: {
              spec: {}
            }
          },
          coverage: {
            includeAllSources: true,
            report: ['lcov', 'text-summary'],
            reportDir: 'tests/coverage'
          },
        },
        src: ['dist/ink.js']
      }
    },
  });

  // Load the plugin that provides tasks.
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-rollup');
  grunt.loadNpmTasks('grunt-jasmine-node');
  grunt.loadNpmTasks('grunt-jasmine-node-coverage');
  grunt.loadNpmTasks('grunt-env');

  // Default task(s).
  grunt.registerTask('default', ['rollup']);
  grunt.registerTask('test:es2015', ['env:es2015', 'jasmine_node:es2015']);
  grunt.registerTask('test:legacy', ['env:legacy', 'jasmine_node:legacy']);
};
