import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Each test file runs in its own fork → its own in-memory DB (full isolation).
    pool: 'forks',
    include: ['tests/**/*.test.js'],
    testTimeout: 15000,
  },
})
