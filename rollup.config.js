import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const moduleName = 'inkjs';
const inputFile = 'engine/Story.js';
const format = 'umd';

export default [
  {
    name: moduleName,
    input: inputFile,
    output: {
      file: 'dist/ink.js',
      format: format
    },
    plugins: [
      resolve(),
      babel({
        exclude: 'node_modules/**',
      })
    ]
  },
  {
    name: moduleName,
    input: inputFile,
    output: {
      file: 'dist/ink-es2015.js',
      format: format
    },
    plugins: [
      resolve()
    ]
  }
];