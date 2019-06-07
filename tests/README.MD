# Working on inkjs tests

The test suite can be run with the command `npm run test`. If you plan to work on tests, you can run `npm run -- --watch` which will re-run the tests every time a file is changed. You can use it in conjunction with `npm run watch` if you're working on the ink source files at the same time.

The tests are run against an ink story that is almost like a serie of unit tests. The [inkfiles folder](https://github.com/y-lohse/inkjs/blob/master/tests/inkfiles/) contains the ink story as well as the compiled version.

Actual test files can be found in the [`tests/specs` folder](https://github.com/y-lohse/inkjs/blob/master/tests/specs/) and they are written using [jest](https://jestjs.io/). You can generate a coverage report by running `npm run -- --coverage`, and you can forward other jest options in the same way.
