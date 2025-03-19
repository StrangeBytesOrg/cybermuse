import pluginVue from 'eslint-plugin-vue'
import vueTsEslintConfig from '@vue/eslint-config-typescript'
import oxlint from 'eslint-plugin-oxlint'

export default [
    {
        name: 'app/files-to-lint',
        files: ['**/*.{ts,mts,vue}'],
    },
    {
        name: 'app/files-to-ignore',
        ignores: ['**/dist/**'],
    },
    ...pluginVue.configs['flat/essential'],
    ...vueTsEslintConfig(),
    ...oxlint.configs['flat/recommended'],
    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'prefer-const': 'off',
        },
    },
]
