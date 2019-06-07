import sourcemaps from 'rollup-plugin-sourcemaps';
import { uglify } from "rollup-plugin-uglify";
import { terser } from "rollup-plugin-terser";
import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';

const moduleName = 'inkjs';
const inputFile = 'src/Story.ts';
const format = 'umd';
const tsconfig = {
  tsconfig: "tsconfig.json",
  tsconfigOverride: {
    compilerOptions: {
      module: "es6",
      declaration: false
    }
  }
}

export default [
  {
    input: inputFile,
    output: {
      name: moduleName,
      file: 'dist/ink.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      resolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
      }),
      uglify(),
      sourcemaps()
    ]
  },
  {
    input: inputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-es2015.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      resolve(),
      typescript(tsconfig),
      terser(),
      sourcemaps()
    ]
  }
];