import type { Role } from './api'

export interface Field {
  name: string
  label: string
  type?: 'number' | 'date' | 'textarea' | 'checkbox' | 'select' | 'email'
  required?: boolean
  options?: string[]
  source?: string
  min?: number
  max?: number
  nullable?: boolean
}
export interface ResourceView { key: string; label: string; fields: Field[]; readOnly?: boolean; roles?: Role[] }

const notes: Field = { name: 'notes', label: 'ملاحظات', type: 'textarea' }
const athlete: Field = { name: 'athlete_id', label: 'السباح', source: 'athletes', required: true }
const session: Field = { name: 'session_id', label: 'الحصة', source: 'sessions', required: true }
const user: Field = { name: 'user_id', label: 'الحساب', source: 'members', required: true }
const stroke: Field = { name: 'stroke', label: 'نوع السباحة', type: 'select', options: ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly', 'IM'] }
const intensity: Field = { name: 'intensity_level', label: 'الشدة (1–10)', type: 'number', min: 1, max: 10 }

export const views: ResourceView[] = [
  { key: 'seasons', label: 'المواسم', fields: [{ name: 'name', label: 'اسم الموسم', required: true }, { name: 'start_date', label: 'البداية', type: 'date', required: true }, { name: 'end_date', label: 'النهاية', type: 'date', required: true }, { name: 'is_active', label: 'موسم نشط', type: 'checkbox' }, notes] },
  { key: 'weekly-plans', label: 'الخطط الأسبوعية', fields: [{ name: 'season_id', label: 'الموسم', source: 'seasons', required: true }, { name: 'week_number', label: 'رقم الأسبوع', type: 'number', min: 1, max: 36, required: true }, { name: 'phase', label: 'المرحلة', type: 'select', options: ['GPP', 'SPP1', 'SPP2', 'COMP', 'TAPER', 'CHAMP'], required: true }, { name: 'total_volume', label: 'الحجم الإجمالي', type: 'number', min: 0 }, intensity, { name: 'focus_area', label: 'محور التدريب' }, notes] },
  { key: 'sessions', label: 'الحصص', fields: [{ name: 'weekly_plan_id', label: 'الخطة', source: 'weekly-plans', required: true }, { name: 'title', label: 'عنوان الحصة', required: true }, { name: 'session_date', label: 'التاريخ', type: 'date', required: true }, { name: 'session_number', label: 'رقم الحصة', type: 'number', min: 1, max: 6 }, { name: 'duration_minutes', label: 'المدة بالدقائق', type: 'number', min: 1 }, { name: 'total_distance', label: 'المسافة بالمتر', type: 'number', min: 1 }, intensity, { name: 'focus_area', label: 'محور التدريب' }, { name: 'description', label: 'الوصف', type: 'textarea' }] },
  { key: 'drills', label: 'التمارين', fields: [session, { name: 'sequence', label: 'الترتيب', type: 'number', min: 1, required: true }, { name: 'title', label: 'التمرين', required: true }, { name: 'distance', label: 'المسافة', type: 'number', min: 1 }, { name: 'duration_minutes', label: 'الدقائق', type: 'number', min: 1 }, stroke, { name: 'intensity', label: 'الشدة' }, { name: 'pace_target', label: 'الإيقاع المستهدف' }, { name: 'equipment', label: 'المعدات' }, { name: 'description', label: 'الوصف', type: 'textarea' }, notes] },
  { key: 'athletes', label: 'السباحون', fields: [{ name: 'name', label: 'اسم السباح', required: true }, { name: 'date_of_birth', label: 'تاريخ الميلاد', type: 'date' }, { name: 'gender', label: 'الجنس', type: 'select', options: ['M', 'F'] }, { name: 'category', label: 'الفئة', type: 'select', options: ['Sprint', 'Middle', 'Distance'] }, { ...stroke, name: 'main_stroke' }, { name: 'coach_id', label: 'المدرب', source: 'coaches', nullable: true }, { ...user, required: false, nullable: true }, { name: 'css_velocity', label: 'سرعة CSS', type: 'number', min: 0 }, ...['target_t1', 'target_t2', 'target_t3'].map((name, index) => ({ name, label: `هدف الاختبار ${index + 1}`, type: 'number' as const, min: 0 })), { name: 'is_active', label: 'نشط', type: 'checkbox' }, notes] },
  { key: 'coaches', label: 'المدربون', roles: ['admin', 'coach'], fields: [user, { name: 'specialization', label: 'التخصص' }, { name: 'certification', label: 'الشهادة' }] },
  { key: 'parents', label: 'أولياء الأمور', fields: [user, { name: 'relationship', label: 'صلة القرابة', type: 'select', options: ['father', 'mother', 'guardian'] }] },
  { key: 'parent-athlete-links', label: 'ربط أولياء الأمور', fields: [{ name: 'parent_id', label: 'ولي الأمر', source: 'parents', required: true }, athlete] },
  { key: 'attendance', label: 'الحضور', fields: [session, athlete, { name: 'status', label: 'الحالة', type: 'select', options: ['present', 'absent', 'excused', 'pending'], required: true }, { name: 'absence_reason', label: 'سبب الغياب', type: 'textarea' }, notes] },
  { key: 'absence-requests', label: 'طلبات الغياب', fields: [session, athlete, { name: 'parent_id', label: 'ولي الأمر', source: 'parents', required: true }, { name: 'reason', label: 'السبب', required: true }, { name: 'status', label: 'الحالة', type: 'select', options: ['pending', 'approved', 'rejected'] }] },
  { key: 'trial-results', label: 'نتائج الاختبارات', fields: [athlete, { name: 'trial_number', label: 'الاختبار (1–3)', type: 'number', min: 1, max: 3, required: true }, { name: 'trial_date', label: 'التاريخ', type: 'date', required: true }, { name: 'event', label: 'السباق', required: true }, { name: 'actual_time', label: 'الزمن الفعلي', type: 'number', min: 0, required: true }, { name: 'target_time', label: 'الزمن المستهدف', type: 'number', min: 0 }, stroke, { name: 'rpe', label: 'الجهد المدرك', type: 'number', min: 1, max: 10 }, { name: 'stroke_rate', label: 'معدل الضربات', type: 'number', min: 0 }, notes] },
  { key: 'progress-tracking', label: 'متابعة التطور', fields: [athlete, { name: 'tracking_date', label: 'التاريخ', type: 'date', required: true }, { name: 'metric', label: 'المؤشر', required: true }, { name: 'value', label: 'القيمة', type: 'number', min: 0, required: true }, notes] },
  { key: 'notifications', label: 'الإشعارات', fields: [{ name: 'recipient_id', label: 'المستلم', source: 'members', required: true }, { name: 'title', label: 'العنوان', required: true }, { name: 'message', label: 'النص', type: 'textarea', required: true }] },
  { key: 'messages', label: 'الرسائل', fields: [{ name: 'recipient_id', label: 'المستلم', source: 'members', required: true }, { name: 'content', label: 'الرسالة', type: 'textarea', required: true }] },
  { key: 'audit-logs', label: 'سجل العمليات', roles: ['admin'], readOnly: true, fields: [{ name: 'action', label: 'الإجراء' }, { name: 'resource', label: 'القسم' }, { name: 'record_id', label: 'السجل' }, { name: 'created_at', label: 'الوقت' }] },
]

export const roleLabels: Record<Role, string> = { admin: 'مدير الأكاديمية', coach: 'مدرب', parent: 'ولي أمر', athlete: 'سباح' }

export function recordLabel(record: Record<string, unknown>) {
  return String(record.name || record.title || record.display_name || record.email || (record.week_number ? `الأسبوع ${record.week_number} · ${record.phase}` : '') || record.user_id || record.id)
}
