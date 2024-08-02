import sourcemaps from 'rollup-plugin-sourcemaps';
import terser from "@rollup/plugin-terser";
import typescript from 'rollup-plugin-typescript2';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';

const moduleName = 'inkjs';
const engineOnlyInputFile = 'src/engine/Story.ts';
const fullfeatureInputFile = 'src/compiler/Compiler.ts';
const posixHandlerInputFile = 'src/compiler/FileHandler/PosixFileHandler.ts';
const inklecateInputFile = 'script/inkjs-compiler.ts';
const format = 'umd';
const tsconfig = {
  tsconfig: "tsconfig.json",
  tsconfigOverride: {
    compilerOptions: {
      module: "es6",
      declaration: false,
      moduleResolution: "node"
    }
  }
}

export default [
  {
    input: engineOnlyInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink.mjs',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: fullfeatureInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-full.mjs',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: engineOnlyInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: engineOnlyInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-es2015.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: fullfeatureInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-full.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: fullfeatureInputFile,
    output: {
      name: moduleName,
      file: 'dist/ink-full-es2015.js',
      format: format,
      sourcemap: true
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      terser(),
      sourcemaps()
    ]
  },
  {
    input: inklecateInputFile,
    output: {
      name: 'inkjs-compiler',
      file: 'bin/inkjs-compiler.js',
      format: 'commonjs',
      sourcemap: false
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      //sourcemaps()
    ]
  },
  {
    input: posixHandlerInputFile,
    output: {
      name: 'posixFileHandle',
      file: 'dist/inkjs-full-posixhandler.js',
      format: 'commonjs',
      sourcemap: false
    },
    plugins: [
      nodeResolve(),
      typescript(tsconfig),
      babel({
        exclude: 'node_modules/**',
        extensions: ['.js', '.ts'],
        babelHelpers: 'bundled'
      }),
      terser(),
      //sourcemaps()
    ]
  },
];