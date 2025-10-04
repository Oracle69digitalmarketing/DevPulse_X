module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier' // only eslint-config-prettier here, remove plugin:prettier/recommended to avoid circular refs
  ],
  rules: {
    // TypeScript rules
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',

    // Prettier integration
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
