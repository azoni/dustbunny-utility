module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    camelcase: 'off',
    semi: 'off',
    'import/extensions': 'off',
    'no-await-in-loop': 'off',
    'no-console': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'linebreak-style': 'off',
    'no-underscore-dangle': 'off',
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
  },
};
