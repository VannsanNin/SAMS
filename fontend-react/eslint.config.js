import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // shared.jsx intentionally exports both design tokens and React components.
      'react-refresh/only-export-components': 'off',
      // Data-loading effects call async loaders that update state after awaiting.
      // Keep this diagnostic visible without treating the valid fetch pattern as an error.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
