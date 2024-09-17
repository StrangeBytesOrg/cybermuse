module.exports = {
    extends: [
        'plugin:vue/vue3-essential',
        '@vue/eslint-config-typescript/recommended',
        '@vue/eslint-config-prettier/skip-formatting',
    ],
    env: {
        browser: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
    },
    rules: {
        'vue/multi-word-component-names': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        'prefer-const': 'off',
    },
    ignorePatterns: ['node_modules', 'dist'],
}
