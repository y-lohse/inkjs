import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const moduleName = 'inkjs';
const inputFile = 'engine/Story.js';
const format = 'umd';

export default [
  {
    input: inputFile,
    output: {
      name: moduleName,
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
    input: inputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-es2015.js',
      format: format
    },
    plugins: [
      resolve()
    ]
  }
];