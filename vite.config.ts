/// <reference types="vitest" />
import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    exclude: ['test/testing_data/**', 'node_modules'],
    testTimeout: 40000,
    globals: true,
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom',
    //setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      include: ['src/**.js'],
      exclude: ['test/**', '*.ts'],
      reportOnFailure: true,
    },
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})