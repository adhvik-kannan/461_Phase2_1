/// <reference types="vitest" />
import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    exclude: ['test/testing_data/**', 'node_modules'],
    //setupFiles : ['./test/setup.ts'],
    testTimeout: 40000,
    globals: true,
    includeSource: ['src/**/*.{js,ts}'], 
    environment: 'jsdom',
    //setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text-summary', 'json-summary', 'json'],
      
      reportsDirectory: './coverage',
      include: ['src/**.js'],
      exclude: ['test/**', '*.ts'],
      reportOnFailure: true,
    },
  },
  define: { 
    'import.meta.vitest': 'undefined', 
  },
})