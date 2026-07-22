import cron from 'node-cron'
import { markExpiringSoon, autoRevokeExpired } from './requestService.js'

export function startCronJobs() {
  console.log('⏰ Starting cron jobs...')

  // Every hour: check for expiring_soon
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Checking expiring permissions...')
    try {
      const count = await markExpiringSoon()
      if (count > 0) console.log(`[Cron] Marked ${count} as expiring_soon`)
    } catch (e) {
      console.error('[Cron] markExpiringSoon error:', e)
    }
  })

  // Every 5 minutes: auto-revoke expired
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Cron] Auto-revoking expired permissions...')
    try {
      const count = await autoRevokeExpired()
      if (count > 0) console.log(`[Cron] Auto-revoked ${count} expired permissions`)
    } catch (e) {
      console.error('[Cron] autoRevokeExpired error:', e)
    }
  })

  // Run immediately on startup
  ;(async () => {
    try {
      const n1 = await markExpiringSoon()
      const n2 = await autoRevokeExpired()
      if (n1 > 0) console.log(`[Startup] Marked ${n1} expiring_soon`)
      if (n2 > 0) console.log(`[Startup] Auto-revoked ${n2} expired`)
    } catch (e) {
      console.error('[Startup Cron] Error:', e)
    }
  })()
}
