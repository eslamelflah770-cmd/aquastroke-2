import { getUser, refreshSession } from '@netlify/identity'

export interface Academy { id: string; name: string; city?: string; country?: string; phone?: string; description?: string }
export type Role = 'admin' | 'coach' | 'parent' | 'athlete'
export interface Membership { id: string; academy_id: string; user_id: string; role: Role }
export interface Profile { id: string; email: string; display_name: string; platform_admin: boolean; memberships: Membership[] }
export type DataRecord = Record<string, string | number | boolean | null>
export interface Page { data: DataRecord[]; total: number; page: number; limit: number; total_pages: number }
export interface Stats { athletes: number; coaches: number; sessions: number; weekly_plans: number }

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}

export async function api<T>(path: string, options: RequestInit = {}, academyId?: string, retry = true): Promise<T> {
  const user = await getUser()
  if (!user) throw new ApiError('انتهت الجلسة. سجّل الدخول مجدداً.', 401)
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (academyId) headers.set('X-Academy-Id', academyId)
  const result = await fetch(`/api/${path}`, { ...options, headers, credentials: 'same-origin' })
  if (result.status === 401 && retry && await refreshSession()) return api<T>(path, options, academyId, false)
  if (!result.headers.get('content-type')?.includes('application/json')) throw new ApiError('خدمة البيانات غير متاحة. شغّل الموقع عبر Netlify وتحقق من نشر الدوال.', result.status)
  const payload = await result.json() as { success: boolean; data: T; error?: string; details?: { field: string; message: string }[] }
  if (!result.ok || !payload.success) {
    const detail = payload.details?.map((item) => `${item.field}: ${item.message}`).join(' — ')
    throw new ApiError(detail || payload.error || 'تعذر تحميل البيانات.', result.status)
  }
  return payload.data
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.name === 'MissingIdentityError') return 'خدمة تسجيل الدخول غير متاحة. استخدم Netlify Dev محلياً أو تحقق من تفعيل Identity في الموقع.'
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع. أعد المحاولة.'
}
