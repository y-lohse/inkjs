# Contributing to inkjs

**⚠️ This document is a work in progress.**

We're very happy to hear that you want to contribute! 🎊

## Asking question / Reporting issues / Getting in touch

### I have a question

1. Check whether it has been asked before or not. You can either search through
   [issues].
2. If it hasn't been asked before, open an issue.

[issues]: https://github.com/y-lohse/inkjs/issues

### I encountered a bug

Open an issue or fix the bug yourself and submit a pull request!

### I think _inkjs_ would be better with feature X…

We usually don't accept new features in _inkjs_. The purpose of the project is
to provide an implementation of ink in JavaScript, compliant with the reference
implementation.

If you feel that ink is missing a feature, we recommend that you bring it up in
the [main repository] first, or alternatively, in the official [discord server].

[main repository]: https://github.com/inkle/ink
[discord server]: https://discord.gg/inkle

## Rules & Conventions when porting code from C#

1. Do not port comments from the C# codebase, but do add `inkjs`-centric comment
   when it make sense. For example, it's important to document when `inkjs`
   display a slightly different behavior than the reference implementation.

2. Try to match the C# type, that means that `String` translates to `string | null`
   in TypeScript. In order to reduce confusion however, exposed methods
   that interact with JavaScript should use optional parameter / return types
   (i. e. `variable?: <type>`) when they are optional / nullable in
   the original codebase.

_To be added._

### Style guide

_inkjs_ uses [prettier] and [esLint] to ensure code consistency. We recommend
that you run prettier either on save or before submitting your PR. Our CI lints
every PR submitted, so make sure your code passes validation. Two NPM tasks
can help you:

- `lint` runs the linter
- `lint:fix` fixes lint errors and warnings automatically

[prettier]: https://prettier.io/
[eslint]: https://eslint.org/

### Porting tests & writing new specs

**inkjs** contains two test suites. The first one contains inkjs-centric tests,
while the second one has been ported from the reference C# implementation.

Both test suites are ran twice, first against the TypeScript code
(transpiled on the fly) and then, a second time, against the distributable,
minified resulting JavaScript file.

- `test` runs the full test suite, both in TypeScript and JavaScript;
- `test:typescript` runs the TypeScript test suite;
- `test:javascript` runs the JavaScript test suite;
- `test:javascript:dist` runs the test suite against the modern distributable
  JavaScript file.
- `test:javascript:legacy` runs the test suite against the legacy distributable
  JavaScript file.
- `test:compileFiles` compiles the fixtures required by the test case (requires
  inklecate to be available in `$PATH`)

`test:compileFiles` needs to be run again every time new tests are added or when
porting a new version of the runtime. The fixtures should always be compiled
with the latest version of inklecate.

⚠️ Running `test:javascript` and its variants won't transpile the files, so be
sure to run `build` first.

#### Porting tests from the reference implementation

_To be added._

#### Writing new specs

_To be added._

## Releasing a new version

The repository is set up to automatically publish a new version to [npm](https://www.npmjs.com/package/inkjs) whenever [a new release is created through Github](https://github.com/y-lohse/inkjs/releases). The corresponding Github workflow can be found [here](https://github.com/y-lohse/inkjs/blob/master/.github/workflows/npm-publish.yml). The secret npm token is stored via the Github UI — if it needs to be updated, get in touch with @y-lohse 😀!

To actually release a new version:

1. Update the `version` field in the package.json to the version you wish to publish
2. Update the compatibility table in the README file
3. Create a new release through Github. Use the same version number as in the package.json file, prefixed with `v` (eg. `v1.2.3` if the package.json `version` field is `1.2.3`).
