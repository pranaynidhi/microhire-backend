module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./test/setupTestEnv.js'],
  testMatch: ['**/test/**/*.test.js'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  verbose: true,
  testTimeout: 30000
};
