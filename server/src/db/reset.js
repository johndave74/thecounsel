// Wipe and reseed the database. Usage: `npm run reset`
import { closeDb } from './index.js'
import { seedDatabase } from './seed.js'

seedDatabase({ force: true })
  .then(() => {
    console.log('[reset] database reset to demo dataset')
    closeDb()
  })
  .catch((err) => {
    console.error('[reset] failed:', err)
    process.exit(1)
  })
