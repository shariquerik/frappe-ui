import path from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import istanbul from 'vite-plugin-istanbul'
import { lucideIcons } from './vite/lucideIcons'

const coverageEnabled = process.env.COVERAGE === 'true'

export default defineConfig({
  plugins: [
    vue(),
    lucideIcons({
      // The <List.*> family is only consumed through the `List` namespace
      // import, not as auto-imported global tags. Skipping it here also
      // prevents `List/primitives/ListItem.vue` from colliding with the
      // unrelated `components/ListItem.vue` global.
      componentGlobs: [
        'src/components/**/*.vue',
        '!src/components/**/stories/*.vue',
        '!src/components/List/**/*.vue',
      ],
    }),
    coverageEnabled &&
      istanbul({
        include: 'src/**/*',
        exclude: [
          'node_modules',
          'src/**/*.cy.ts',
          'src/**/*.spec.ts',
          'src/**/*.test.ts',
          'src/**/stories/**',
        ],
        extension: ['.js', '.ts', '.vue'],
        cypress: true,
        requireEnv: false,
      }),
  ],
  resolve: {
    alias: {
      'tailwind.config.js': path.resolve(__dirname, 'tailwind.config.js'),
    },
  },
  optimizeDeps: {
    include: ['tailwind.config.js'],
  },
})
