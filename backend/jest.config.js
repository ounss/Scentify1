// CONFIGURATION JEST (jest.config.js)
// ==========================================

module.exports = {
  testEnvironment: "node",
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  testMatch: ["**/__tests__/**/*.(js|jsx)", "**/*.(test|spec).(js|jsx)"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/coverage/"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "models/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "utils/**/*.js",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
