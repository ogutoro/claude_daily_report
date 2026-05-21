import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'
import tseslint from 'typescript-eslint'

export default [
  {
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts', '**/*.tsx'],
  })),
  prettierConfig,
]
