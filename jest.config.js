module.exports = {
  collectCoverageFrom: [
    "engine/**/*", // sourcemaps will point to the actual source files
    "!engine/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "json",
  ],
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/?(*.)+(spec|test).[tj]s?(x)"
  ],
  transform: {}
};
