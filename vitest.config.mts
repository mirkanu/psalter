import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config } from 'dotenv'

config({ path: '.env' })

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts', 'scripts/**/*.test.ts'],
    testTimeout: 15000,
  },
})
