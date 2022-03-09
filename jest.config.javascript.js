module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.(spec|test).js"
  ],
  testPathIgnorePatterns: [
    "<rootDir>/src/"
  ],
  setupFilesAfterEnv: [
    "<rootDir>/tests/specs/setupTests.js"
  ],
};
