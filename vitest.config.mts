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
    // VPS-wide NODE_ENV=production (see STATE.md) otherwise leaks into the
    // test worker process, resolving React's production build — which strips
    // the `React.act` testing export and breaks every @testing-library/react
    // render()/renderHook() call. Force `test` here so React resolves its
    // development build during test runs only (no effect on the app build).
    env: {
      NODE_ENV: 'test',
    },
  },
})
