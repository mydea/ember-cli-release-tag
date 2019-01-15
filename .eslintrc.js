module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2017,
    sourceType: 'script'
  },
  plugins: [
    'node'
  ],
  extends: [
    'eslint:recommended',
    'plugin:node/recommended'
  ],
  env: {
    browser: false,
    node: true
  },
  rules: {
  },
  overrides: [
    // node tests
    {
      files: [
        'node-tests/**'
      ],
      parserOptions: {
        sourceType: 'script',
        ecmaVersion: 2017
      },
      env: {
        browser: false,
        node: true,
        mocha: true
      },
      rules: {
        'node/no-unpublished-require': 'off'
      }
    },
  ]
};
