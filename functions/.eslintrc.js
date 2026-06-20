module.exports = {
  // This 'env' block is the fix. It tells the linter to expect Node.js globals.
  "env": {
    "node": true,
    "es6": true,
  },
  "extends": [
    "eslint:recommended",
    "google",
  ],
  "rules": {
    "quotes": ["error", "double"],
  },
  "parserOptions": {
    "ecmaVersion": 2020, // Or a version that suits your project
  },
};