import env from './config/env.js'
import { createApp } from './app.js'
import { getDb, closeDb } from './db/index.js'
import { seedDatabase } from './db/seed.js'

async function start() {
  // Ensure schema exists; auto-seed an empty database on first run for a
  // zero-config developer experience.
  getDb()
  await seedDatabase({ silent: true })

  const app = createApp()
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[counsel-api] listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
  })

  const shutdown = (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[counsel-api] ${signal} received — shutting down`)
    server.close(() => {
      closeDb()
      process.exit(0)
    })
    // Force-exit if connections linger
    setTimeout(() => process.exit(1), 10000).unref()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[counsel-api] failed to start:', err)
  process.exit(1)
})
