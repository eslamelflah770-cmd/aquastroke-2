import { randomUUID } from 'node:crypto'
import { getIdentityConfig, getUser, verifyRequestOrigin } from '@netlify/identity'
import { and, count, desc, eq, getTableColumns, inArray, or, sql, type SQL } from 'drizzle-orm'
import type { AnyPgTable } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { getDb } from '../db/index.js'
import * as tables from '../db/schema.js'
import { academyInput, identifier, membershipInput, paginationInput, resources, updateInput } from './validation.js'

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

function response(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'أرسل البيانات بصيغة JSON.')
  const raw = await request.text()
  if (raw.length > 64000) throw new HttpError(413, 'حجم الطلب أكبر من المسموح.')
  try { return JSON.parse(raw) as unknown } catch { throw new HttpError(400, 'صيغة البيانات غير صحيحة.') }
}

function columns(table: AnyPgTable) { return getTableColumns(table) }
function scoped(table: AnyPgTable, academyId: string, id?: string) {
  const fields = columns(table)
  return and(eq(fields.academy_id, academyId), id ? eq(fields.id, id) : undefined)
}

export async function handleApi(request: Request): Promise<Response> {
  const requestId = randomUUID()
  try {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean)
    if (path[0] === 'health' && request.method === 'GET') {
      await getDb().execute(sql`select 1`)
      return response({ status: 'ok', database: 'connected' })
    }
    if (!['me', 'academies', 'stats'].includes(path[0]) && !Object.hasOwn(resources, path[0])) throw new HttpError(404, 'المسار غير موجود.')
    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) throw new HttpError(405, 'طريقة الطلب غير مدعومة.')
    const bearer = request.headers.get('authorization')
    if (request.method !== 'GET' && !bearer?.startsWith('Bearer ')) verifyRequestOrigin(request)
    let identity = await getUser()
    if (bearer?.startsWith('Bearer ')) {
      const configuration = getIdentityConfig()
      if (!configuration) throw new HttpError(503, 'خدمة المصادقة غير متاحة.')
      const verified = await fetch(`${configuration.url}/user`, { headers: { Authorization: bearer }, signal: AbortSignal.timeout(10000) })
      if (!verified.ok) throw new HttpError(401, 'الجلسة غير صالحة أو منتهية.')
      const verifiedUser = z.object({ id: identifier, email: z.email(), user_metadata: z.object({ full_name: z.string().optional() }).passthrough().optional(), app_metadata: z.object({ roles: z.array(z.string()).optional() }).passthrough().optional() }).parse(await verified.json())
      identity = { id: verifiedUser.id, email: verifiedUser.email, name: verifiedUser.user_metadata?.full_name, roles: verifiedUser.app_metadata?.roles }
    }
    if (!identity?.email || !identifier.safeParse(identity.id).success) throw new HttpError(401, 'سجّل الدخول للوصول إلى البيانات.')
    const db = getDb()
    await db.insert(tables.users).values({ id: identity.id, email: identity.email.toLowerCase(), display_name: identity.name?.slice(0, 255) || identity.email }).onConflictDoUpdate({
      target: tables.users.id,
      set: { email: identity.email.toLowerCase(), display_name: identity.name?.slice(0, 255) || identity.email, updated_at: new Date() },
    })
    const platformAdmin = identity.roles?.includes('admin') === true
    if (path[0] === 'me' && request.method === 'GET' && path.length === 1) {
      const memberships = await db.select().from(tables.memberships).where(eq(tables.memberships.user_id, identity.id))
      return response({ id: identity.id, email: identity.email, display_name: identity.name || identity.email, platform_admin: platformAdmin, memberships })
    }
    if (path[0] === 'academies' && path.length === 1) {
      if (request.method === 'GET') {
        if (platformAdmin) return response(await db.select().from(tables.academies).orderBy(desc(tables.academies.created_at)))
        const records = await db.select({ academy: tables.academies }).from(tables.academies).innerJoin(tables.memberships, and(eq(tables.memberships.academy_id, tables.academies.id), eq(tables.memberships.user_id, identity.id)))
        return response(records.map((record) => record.academy))
      }
      if (request.method === 'POST') {
        const input = academyInput.parse(await readBody(request))
        const academy = await db.transaction(async (transaction) => {
          const [created] = await transaction.insert(tables.academies).values({ ...input, slug: randomUUID(), created_by: identity.id }).returning()
          await transaction.insert(tables.memberships).values({ academy_id: created.id, user_id: identity.id, role: 'admin' })
          return created
        })
        return response(academy, 201)
      }
      throw new HttpError(405, 'طريقة الطلب غير مدعومة.')
    }
    const academyId = identifier.parse(path[0] === 'academies' ? path[1] : request.headers.get('X-Academy-Id') || url.searchParams.get('academy_id'))
    const [membership] = await db.select().from(tables.memberships).where(and(eq(tables.memberships.academy_id, academyId), eq(tables.memberships.user_id, identity.id)))
    const role = platformAdmin ? 'admin' : membership?.role
    if (!role) throw new HttpError(403, 'لا تملك صلاحية الوصول إلى هذه الأكاديمية.')
    const [academy] = await db.select().from(tables.academies).where(eq(tables.academies.id, academyId))
    if (!academy) throw new HttpError(404, 'الأكاديمية غير موجودة.')
    const manager = role === 'admin' || role === 'coach'

    if (path[0] === 'academies' && path.length === 2) {
      if (role !== 'admin') throw new HttpError(403, 'تعديل الأكاديمية متاح للمدير فقط.')
      if (request.method !== 'PUT') throw new HttpError(405, 'طريقة الطلب غير مدعومة.')
      const input = academyInput.parse(await readBody(request))
      const [updated] = await db.update(tables.academies).set({ ...input, updated_at: new Date() }).where(eq(tables.academies.id, academyId)).returning()
      return response(updated)
    }
    if (path[0] === 'academies' && path[2] === 'members' && path.length <= 4) {
      if (request.method === 'GET' && path.length === 3) {
        const members = await db.select({ id: tables.memberships.id, user_id: tables.users.id, email: tables.users.email, display_name: tables.users.display_name, role: tables.memberships.role }).from(tables.memberships).innerJoin(tables.users, eq(tables.users.id, tables.memberships.user_id)).where(eq(tables.memberships.academy_id, academyId))
        return response(manager ? members : members.map(({ email: _email, ...member }) => member))
      }
      if (role !== 'admin') throw new HttpError(403, 'إدارة الأعضاء متاحة للمدير فقط.')
      if (request.method === 'POST' && path.length === 3) {
        const input = membershipInput.parse(await readBody(request))
        const [user] = await db.select().from(tables.users).where(eq(tables.users.email, input.email))
        if (!user) throw new HttpError(404, 'على المستخدم التسجيل وتسجيل الدخول مرة واحدة قبل إضافته.')
        const [created] = await db.insert(tables.memberships).values({ academy_id: academyId, user_id: user.id, role: input.role }).returning()
        return response(created, 201)
      }
      if (request.method === 'DELETE' && path.length === 4) {
        const memberId = identifier.parse(path[3])
        await db.transaction(async (transaction) => {
          await transaction.execute(sql`select id from ${tables.academies} where id = ${academyId} for update`)
          const [target] = await transaction.select().from(tables.memberships).where(scoped(tables.memberships, academyId, memberId))
          if (!target) throw new HttpError(404, 'العضو غير موجود.')
          if (target.role === 'admin') {
            const [admins] = await transaction.select({ total: count() }).from(tables.memberships).where(and(eq(tables.memberships.academy_id, academyId), eq(tables.memberships.role, 'admin')))
            if (admins.total <= 1) throw new HttpError(409, 'لا يمكن إزالة آخر مدير للأكاديمية.')
          }
          await transaction.delete(tables.memberships).where(scoped(tables.memberships, academyId, memberId))
        })
        return response({ id: memberId })
      }
      throw new HttpError(405, 'طريقة الطلب غير مدعومة.')
    }

    const permittedAthletes = async () => {
      if (role === 'athlete') return (await db.select({ id: tables.athletes.id }).from(tables.athletes).where(and(eq(tables.athletes.academy_id, academyId), eq(tables.athletes.user_id, identity.id)))).map((record) => record.id)
      if (role === 'parent') return (await db.select({ id: tables.parentAthleteLinks.athlete_id }).from(tables.parentAthleteLinks).innerJoin(tables.parents, eq(tables.parents.id, tables.parentAthleteLinks.parent_id)).where(and(eq(tables.parentAthleteLinks.academy_id, academyId), eq(tables.parents.user_id, identity.id)))).map((record) => record.id)
      return []
    }
    if (path[0] === 'stats' && path.length === 1 && request.method === 'GET') {
      const allowed = manager ? undefined : await permittedAthletes()
      const [athleteCount] = await db.select({ total: count() }).from(tables.athletes).where(and(eq(tables.athletes.academy_id, academyId), allowed ? inArray(tables.athletes.id, allowed) : undefined))
      const [coachCount] = await db.select({ total: count() }).from(tables.coaches).where(eq(tables.coaches.academy_id, academyId))
      const [sessionCount] = await db.select({ total: count() }).from(tables.sessions).where(eq(tables.sessions.academy_id, academyId))
      const [planCount] = await db.select({ total: count() }).from(tables.weeklyPlans).where(eq(tables.weeklyPlans.academy_id, academyId))
      return response({ athletes: athleteCount.total, coaches: coachCount.total, sessions: sessionCount.total, weekly_plans: planCount.total })
    }
    const resourceName = path[0]
    const resource = Object.hasOwn(resources, resourceName) ? resources[resourceName] : undefined
    if (!resource || path.length > 2) throw new HttpError(404, 'المسار غير موجود.')
    const recordId = path[1] ? identifier.parse(path[1]) : undefined
    const fields = columns(resource.table)
    const restrictions: (SQL | undefined)[] = [scoped(resource.table, academyId, recordId)]
    if (resourceName === 'audit-logs' && role !== 'admin') throw new HttpError(403, 'سجل العمليات متاح للمدير فقط.')
    if (resource.privateAthlete && !manager) restrictions.push(inArray(resourceName === 'athletes' ? fields.id : fields.athlete_id, await permittedAthletes()))
    if (resourceName === 'notifications') restrictions.push(eq(fields.recipient_id, identity.id))
    if (resourceName === 'messages') restrictions.push(or(eq(fields.sender_id, identity.id), eq(fields.recipient_id, identity.id)))
    if (resourceName === 'parents' && !manager) restrictions.push(eq(fields.user_id, identity.id))
    if (resourceName === 'coaches' && !manager) restrictions.push(eq(fields.user_id, identity.id))
    if (!manager && !resource.readableByAll && !resource.privateAthlete && !['messages', 'notifications', 'parents', 'coaches'].includes(resourceName)) throw new HttpError(403, 'لا تملك الصلاحية المطلوبة.')
    for (const filter of resource.filters) {
      const value = url.searchParams.get(filter)
      if (value) restrictions.push(eq(fields[filter], identifier.parse(value)))
    }
    const predicate = and(...restrictions)
    if (request.method === 'GET') {
      if (recordId) {
        const [record] = await db.select().from(resource.table).where(predicate)
        if (!record) throw new HttpError(404, 'السجل غير موجود أو غير متاح لك.')
        return response(record)
      }
      const { page, limit } = paginationInput.parse(Object.fromEntries(url.searchParams))
      const [total] = await db.select({ total: count() }).from(resource.table).where(predicate)
      const records = await db.select().from(resource.table).where(predicate).orderBy(desc(fields.created_at), desc(fields.id)).limit(limit).offset((page - 1) * limit)
      return response({ data: records, total: total.total, page, limit, total_pages: Math.ceil(total.total / limit) })
    }
    if (resourceName === 'audit-logs') throw new HttpError(405, 'سجل العمليات للقراءة فقط.')
    if (request.method === 'POST' && recordId || request.method !== 'POST' && !recordId) throw new HttpError(405, 'طريقة الطلب غير مدعومة لهذا المسار.')
    const parentAbsence = resourceName === 'absence-requests' && role === 'parent' && request.method === 'POST'
    const sendingMessage = resourceName === 'messages' && request.method === 'POST'
    const markingRead = ['notifications', 'messages'].includes(resourceName) && ['PUT', 'PATCH'].includes(request.method)
    if (!manager && !parentAbsence && !sendingMessage && !markingRead) throw new HttpError(403, 'لا تملك صلاحية تعديل هذه البيانات.')
    if (['messages', 'notifications'].includes(resourceName) && request.method === 'DELETE') throw new HttpError(405, 'لا يمكن حذف هذه السجلات.')
    if (resourceName === 'notifications' && request.method === 'POST' && !manager) throw new HttpError(403, 'لا تملك الصلاحية المطلوبة.')
    if (markingRead) restrictions.push(eq(fields.recipient_id, identity.id))
    const writePredicate = and(...restrictions)
    const input: Record<string, unknown> = request.method === 'DELETE' ? {} : (request.method === 'POST' ? resource.create : updateInput(resourceName)).parse(await readBody(request))
    if (resourceName === 'seasons' && request.method === 'POST' && String(input.end_date) < String(input.start_date)) throw new HttpError(400, 'نهاية الموسم يجب أن تكون بعد بدايته.')
    if (parentAbsence) {
      const allowed = await permittedAthletes()
      if (!allowed.includes(String(input.athlete_id))) throw new HttpError(403, 'لا يمكنك تقديم طلب لهذا السباح.')
      const [parent] = await db.select().from(tables.parents).where(and(eq(tables.parents.academy_id, academyId), eq(tables.parents.user_id, identity.id)))
      if (!parent || input.parent_id !== parent.id) throw new HttpError(403, 'ملف ولي الأمر غير صحيح.')
      input.status = 'pending'
    }
    for (const relation of resource.relations) {
      const value = input[relation.field]
      if (value === undefined || value === null) continue
      const relationFields = columns(relation.table)
      const targetField = relation.table === tables.memberships ? relationFields.user_id : relationFields.id
      const [related] = await db.select().from(relation.table).where(and(eq(relationFields.academy_id, academyId), eq(targetField, value), relation.memberRole ? eq(relationFields.role, relation.memberRole) : undefined))
      if (!related) throw new HttpError(400, `العلاقة ${relation.field} لا تنتمي إلى الأكاديمية أو الدور المطلوب.`)
    }
    const record = await db.transaction(async (transaction) => {
      let result: Record<string, unknown> | undefined
      if (request.method === 'POST') {
        const values: Record<string, unknown> = { ...input, academy_id: academyId }
        if (['attendance', 'trial-results'].includes(resourceName)) values.recorded_by = identity.id
        if (resourceName === 'messages') values.sender_id = identity.id
        const inserted = await transaction.insert(resource.table).values(values).returning()
        result = inserted[0] as Record<string, unknown> | undefined
      } else {
        const [existing] = await transaction.select().from(resource.table).where(writePredicate)
        if (!existing) throw new HttpError(404, 'السجل غير موجود أو غير متاح لك.')
        if (resourceName === 'seasons') {
          const merged = { ...existing, ...input }
          if (String(merged.end_date) < String(merged.start_date)) throw new HttpError(400, 'نهاية الموسم يجب أن تكون بعد بدايته.')
        }
        if (request.method === 'DELETE') [result] = await transaction.delete(resource.table).where(writePredicate).returning()
        else [result] = await transaction.update(resource.table).set({ ...input, updated_at: new Date() }).where(writePredicate).returning()
      }
      if (!result) throw new HttpError(404, 'السجل غير موجود.')
      await transaction.insert(tables.auditLogs).values({ academy_id: academyId, user_id: identity.id, action: request.method, resource: resourceName, record_id: String(result.id) })
      return result
    })
    return response(record, request.method === 'POST' ? 201 : 200)
  } catch (error) {
    let status = 500
    let message = 'تعذر تنفيذ الطلب. تحقق من الخدمة وأعد المحاولة.'
    let details: unknown
    if (error instanceof HttpError) { status = error.status; message = error.message }
    else if (error instanceof z.ZodError) {
      status = 400; message = 'بعض الحقول غير صحيحة.'
      details = error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    } else if (error instanceof Error && 'status' in error && error.status === 403) { status = 403; message = 'مصدر الطلب غير مسموح.' }
    else {
      const databaseError = error as { code?: string; cause?: { code?: string } }
      const code = databaseError?.code || databaseError?.cause?.code
      if (code === '23505') { status = 409; message = 'هذا السجل موجود بالفعل.' }
      if (code === '23503') { status = 409; message = 'السجل مرتبط ببيانات أخرى أو العلاقة غير موجودة.' }
      console.error('API request failed', { requestId, code: code || 'internal' })
    }
    return Response.json({ success: false, error: message, details, request_id: requestId }, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
  }
}
