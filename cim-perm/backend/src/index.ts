import express from 'express'
import cors from 'cors'
import * as dotenv from 'dotenv'
import { createRouter } from './routes'
import { startCronJobs } from './services/cronService'
import './db/pool' // ensure pool connects on startup

dotenv.config()

const app  = express()
const PORT = parseInt(process.env.PORT ?? '3001')

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://mrdi.example']
    : ['http://localhost:8089', 'http://localhost:5173'],
  credentials: true,
}))

app.use(express.json({ limit: '1mb' }))

// Routes
app.use('/perm-api/v1', createRouter())

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 CIM-PERM API running on http://localhost:${PORT}/perm-api/v1`)
  console.log(`   Health: http://localhost:${PORT}/perm-api/v1/health`)
  console.log(`   Mode:   ${process.env.NODE_ENV ?? 'development'}\n`)

  if (process.env.NODE_ENV !== 'production') {
    console.log('📝 Dev auth: add ?dev_email=zhang@mrdi.example to any request')
    console.log('   Role via: set DEV_USER_ROLE=editor|auditor|admin in .env\n')
  }

  startCronJobs()
})
