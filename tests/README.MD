# Working on inkjs tests

The test suite can be run with the command `npm test`. If you plan to work on tests, you can run `npm run watch:test` which will rebuild inkjs and re-run the tests every time a file is changed.

The tests are run against an ink story that is almost like a serie of unit tests. The [inkfiles folder](https://github.com/y-lohse/inkjs/blob/master/tests/inkfiles/) contains the ink story as well as the compiled version.

Actual test files can be found in the [specs folder](https://github.com/y-lohse/inkjs/blob/master/tests/specs/) and they are written using [jasmine](https://jasmine.github.io/).