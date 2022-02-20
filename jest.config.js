module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    "src/engine/**/*.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: [
    "json",
    "text-summary",
    "html"
  ],
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.(spec|test).ts"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/tests/"
  ],
  transform: {
    "^.+\\.ts$": "ts-jest"
  },
  setupFilesAfterEnv: [
    "<rootDir>/src/tests/specs/setupTests.ts"
  ],
};
