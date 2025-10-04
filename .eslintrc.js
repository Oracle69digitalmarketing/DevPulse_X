module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  // Defines global variables for different environments
  env: {
    browser: true, // For webview code
    node: true,    // For extension backend code
    es2020: true,
  },
  // The 'extends' array sets up the core rule configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    // IMPORTANT: This must be the LAST item in the extends array
    'plugin:prettier/recommended',
  ],
  rules: {
    // --- Rule Customizations ---
    // Allows omitting return types on functions, which is common in React components
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Warns about unused variables but allows prefixing with '_' to ignore
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],

    // Not needed in TypeScript projects as types handle prop validation
    'react/prop-types': 'off',

    // Not needed with modern React's new JSX transform
    'react/react-in-jsx-scope': 'off',

    // Enforces Prettier rules as ESLint errors, with a specific setting for line endings
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
