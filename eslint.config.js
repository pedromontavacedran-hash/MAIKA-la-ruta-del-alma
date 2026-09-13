import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  /** No lintar salidas de build (Vite, Gradle/Capacitor). */
  globalIgnores(['dist', 'dist-electron', 'android/**', '**/build/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // El proyecto es grande y legacy; estas reglas del plugin React marcan patrones habituales.
      // Ir bajándolas a error conforme se refactorice (hooks condicionales sí conviene corregir en código).
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/exhaustive-deps': 'off',
      /** Patrón establecido en el código (refs tipo “mirror” en render); migrar a effects debajo por fases. */
      'react-hooks/refs': 'off',
      /** Lazy loaders exportan helpers junto a componentes; Fast Refresh sigue usable. */
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
])
