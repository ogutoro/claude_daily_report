import nextPlugin from '@next/eslint-plugin-next'
import prettierConfig from 'eslint-config-prettier'

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
  prettierConfig,
]
