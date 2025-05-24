/* eslint-disable no-undef */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: './', // Set the root directory for Jest
  moduleFileExtensions: ['ts', 'js'], // Support for TypeScript and JavaScript files
  testMatch: ['<rootDir>/src/**/*.test.ts'], // Looks for test files inside the src folder
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }], // Move ts-jest config here
  },
};
