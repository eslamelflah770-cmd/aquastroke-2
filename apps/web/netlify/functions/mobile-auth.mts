import { AuthError, getIdentityConfig, logout, signup, verifyRequestOrigin } from '@netlify/identity'
import type { Config } from '@netlify/functions'
import { z } from 'zod'

async function exchangePassword(identityUrl: string, email: string, password: string) {
  const result = await fetch(`${identityUrl}/token`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'password', username: email, password }), signal: AbortSignal.timeout(10000),
  })
  if (!result.ok) throw new AuthError('Authentication failed', result.status)
  return z.object({ access_token: z.string(), refresh_token: z.string() }).parse(await result.json())
}

export default async function mobileAuth(request: Request) {
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  try {
    if (request.method !== 'POST') return Response.json({ success: false, error: 'طريقة الطلب غير مدعومة.' }, { status: 405, headers })
    verifyRequestOrigin(request)
    if (!request.headers.get('content-type')?.includes('application/json')) return Response.json({ success: false, error: 'أرسل البيانات بصيغة JSON.' }, { status: 415, headers })
    const raw = await request.text()
    if (raw.length > 12000) return Response.json({ success: false, error: 'الطلب أكبر من المسموح.' }, { status: 413, headers })
    const body: unknown = JSON.parse(raw)
    const action = new URL(request.url).pathname.split('/').at(-1)
    const configuration = getIdentityConfig()
    if (!configuration) throw new Error('Identity unavailable')
    if (action === 'login' || action === 'signup') {
      const input = z.object({ email: z.email(), password: z.string().min(action === 'signup' ? 8 : 1).max(1024), name: z.string().trim().min(1).max(255).optional() }).strict().parse(body)
      const user = action === 'signup' ? await signup(input.email, input.password, { full_name: input.name || input.email }) : null
      const session = action === 'login' || user?.confirmedAt ? await exchangePassword(configuration.url, input.email, input.password) : null
      return Response.json({ success: true, data: { requires_confirmation: !session, session } }, { headers })
    }
    if (action === 'refresh') {
      const input = z.object({ refresh_token: z.string().min(1).max(8192) }).strict().parse(body)
      const result = await fetch(`${configuration.url}/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: input.refresh_token }), signal: AbortSignal.timeout(10000) })
      if (!result.ok) return Response.json({ success: false, error: 'انتهت الجلسة. سجّل الدخول مجدداً.' }, { status: 401, headers })
      const session = z.object({ access_token: z.string(), refresh_token: z.string() }).parse(await result.json())
      return Response.json({ success: true, data: session }, { headers })
    }
    if (action === 'logout') {
      const authorization = request.headers.get('Authorization')
      if (authorization?.startsWith('Bearer ')) await fetch(`${configuration.url}/logout`, { method: 'POST', headers: { Authorization: authorization }, signal: AbortSignal.timeout(10000) })
      else await logout()
      return Response.json({ success: true, data: null }, { headers })
    }
    return Response.json({ success: false, error: 'المسار غير موجود.' }, { status: 404, headers })
  } catch (error) {
    const invalidInput = error instanceof z.ZodError || error instanceof SyntaxError
    const status = invalidInput ? 400 : error instanceof Error && 'status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500 ? error.status : 503
    return Response.json({ success: false, error: invalidInput ? 'تحقق من البريد وكلمة المرور والحقول المطلوبة.' : status === 403 ? 'مصدر الطلب غير مسموح أو التسجيل بالدعوة فقط.' : status === 401 || status === 422 ? 'تحقق من بيانات الدخول وتأكيد البريد الإلكتروني.' : 'خدمة المصادقة غير متاحة حالياً.' }, { status, headers })
  }
}

export const config: Config = { path: '/api/mobile-auth/*', rateLimit: { windowSize: 60, windowLimit: 20, aggregateBy: 'ip' } }
