import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const configFiles = [
  'eslint.config.js',
  'commitlint.config.js',
  'vitest.config.ts',
  'packages/*/vitest.config.ts',
  'packages/*/tsup.config.ts',
];

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.turbo/**', '**/coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: configFiles,
    extends: [tseslint.configs.disableTypeChecked],
  },
);
