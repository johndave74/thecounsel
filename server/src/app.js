import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import env from './config/env.js'
import { notFoundHandler, errorHandler } from './middleware/error.js'
import ApiError from './utils/ApiError.js'

import { openapiSpec, swaggerHtml } from './openapi.js'
import authRoutes from './routes/auth.routes.js'
import userRoutes from './routes/users.routes.js'
import clientRoutes from './routes/clients.routes.js'
import caseRoutes from './routes/cases.routes.js'
import hearingRoutes from './routes/hearings.routes.js'
import documentRoutes from './routes/documents.routes.js'
import taskRoutes from './routes/tasks.routes.js'
import notificationRoutes from './routes/notifications.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'

export function createApp() {
  const app = express()

  // Behind a reverse proxy (nginx, Heroku, etc.) so rate-limit & secure cookies
  // see the real client IP / protocol.
  app.set('trust proxy', 1)
  app.disable('x-powered-by')

  app.use(helmet())
  app.use(compression())

  // CORS — only the configured frontend origins may call the API with creds.
  app.use(cors({
    origin(origin, cb) {
      // allow same-origin / curl / server-to-server (no Origin header)
      if (!origin || env.CORS_ORIGINS.includes(origin)) return cb(null, true)
      cb(new ApiError(403, `Origin ${origin} not allowed by CORS`))
    },
    credentials: true,
  }))

  app.use(express.json({ limit: '1mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  if (!env.isTest) app.use(morgan(env.isProd ? 'combined' : 'dev'))

  // Global, generous safety-net rate limiter (auth routes add a stricter one).
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isTest ? 100000 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => next(ApiError.tooMany()),
  }))

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'counsel-api', time: new Date().toISOString() })
  })

  // API docs — machine-readable spec + Swagger UI. The docs page needs a
  // relaxed CSP so the CDN-hosted Swagger UI assets load (overrides Helmet).
  app.get('/api/openapi.json', (_req, res) => res.json(openapiSpec))
  app.get('/api/docs', (_req, res) => {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://unpkg.com; "
      + "script-src 'self' 'unsafe-inline' https://unpkg.com; worker-src 'self' blob:; connect-src 'self'",
    )
    res.type('html').send(swaggerHtml)
  })

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/cases', caseRoutes)
  app.use('/api/hearings', hearingRoutes)
  app.use('/api/documents', documentRoutes)
  app.use('/api/tasks', taskRoutes)
  app.use('/api/notifications', notificationRoutes)
  app.use('/api/dashboard', dashboardRoutes)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

export default createApp
