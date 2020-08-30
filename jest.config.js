module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^~/(.*)$': '<rootDir>/$1',
  },
  moduleFileExtensions: ['js', 'json'],
  collectCoverage: true,
  collectCoverageFrom: ['<rootDir>/lib/**/*.js'],
}
