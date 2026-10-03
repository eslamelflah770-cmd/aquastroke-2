import type { Config } from '@netlify/functions'
import { handleApi } from '../../server/api.js'

export default async function api(request: Request) {
  return handleApi(request)
}

export const config: Config = { path: '/api/*', excludedPath: '/api/mobile-auth/*', rateLimit: { windowSize: 60, windowLimit: 180, aggregateBy: 'ip' } }
