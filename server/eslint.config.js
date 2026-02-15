import js from '@eslint/js'
import globals from 'globals'
import vitest from 'eslint-plugin-vitest'

export default [
  {
    files: ['**/*.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['**/*.{test,spec,mock}.js'],
    plugins: { vitest },
    languageOptions: {
      globals: {
        ...globals.node,
        ...vitest.environments.node.globals,
      },
    },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/expect-expect': 'warn',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
    },
  },
]
