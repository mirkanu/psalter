import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config } from 'dotenv'

config({ path: '.env' })

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: false,
    include: [
      'tests/**/*.test.{ts,tsx}',
      'src/**/*.test.{ts,tsx}',
      'scripts/**/*.test.{ts,tsx}',
    ],
    testTimeout: 15000,
  },
})
