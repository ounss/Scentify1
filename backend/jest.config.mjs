// jest.config.mjs
export default {
  testEnvironment: "node",

  transform: {
    "^.+\\.js$": "babel-jest",
  },

  testMatch: ["**/*.(test|spec).js"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testTimeout: 15000,

  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html"],

  coveragePathIgnorePatterns: ["/node_modules/", "/tests/", "/coverage/"],

// MESURER SEULEMENT LES FICHIERS DE TEST QUI CONTIENNENT VOTRE CODE
  collectCoverageFrom: [
    "tests/userController.test.js",  // Vos copies de controllers dans tests/
    "tests/testServer.js"
  ]
};
