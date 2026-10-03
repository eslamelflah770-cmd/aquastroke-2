import { useEffect, useState, type FormEvent } from 'react'
import { api, errorMessage, type Academy, type DataRecord, type Role } from '../lib/api'
import { roleLabels } from '../lib/resources'

export function AcademyForm({ academy, onSaved }: { academy?: Academy; onSaved: (record: Academy) => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setSaved(false)
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try { const record = await api<Academy>(academy ? `academies/${academy.id}` : 'academies', { method: academy ? 'PUT' : 'POST', body: JSON.stringify(values) }); await onSaved(record); setSaved(true) }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <form onSubmit={(event) => void submit(event)} className="form-grid">{error && <div className="alert error wide-field" role="alert">{error}</div>}{saved && <div className="alert success wide-field" role="status">حُفظت بيانات الأكاديمية.</div>}{[{ name: 'name', label: 'اسم الأكاديمية', required: true }, { name: 'city', label: 'المدينة' }, { name: 'country', label: 'الدولة' }, { name: 'phone', label: 'الهاتف' }].map((field) => <label key={field.name}>{field.label}<input name={field.name} defaultValue={String(academy?.[field.name as keyof Academy] || '')} required={field.required} disabled={busy} maxLength={field.name === 'name' ? 255 : field.name === 'phone' ? 40 : 100} /></label>)}<label className="wide-field">وصف الأكاديمية<textarea name="description" defaultValue={academy?.description || ''} rows={3} maxLength={5000} disabled={busy} /></label><div className="form-actions wide-field"><button className="primary" disabled={busy} type="submit">{busy ? 'جارٍ الحفظ…' : academy ? 'حفظ التغييرات' : 'إنشاء الأكاديمية'}</button></div></form>
}

export function Members({ academyId }: { academyId: string }) {
  const [members, setMembers] = useState<DataRecord[]>([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [revision, setRevision] = useState(0)
  const [removing, setRemoving] = useState<string | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    api<DataRecord[]>(`academies/${academyId}/members`, { signal: controller.signal }, academyId).then((records) => { if (!controller.signal.aborted) setMembers(records) }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [academyId, revision])
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    const form = event.currentTarget
    try { await api(`academies/${academyId}/members`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form))) }, academyId); form.reset(); setMessage('أُضيف العضو. أنشئ ملف المدرب أو ولي الأمر، أو اربط حساب السباح بملفه من القسم المناسب.'); setRevision((value) => value + 1) }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  async function remove(id: string) {
    setBusy(true); setError(''); setMessage('')
    try { await api(`academies/${academyId}/members/${id}`, { method: 'DELETE' }, academyId); setRemoving(null); setRevision((value) => value + 1) }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <section className="panel"><div className="section-heading"><div><p className="eyebrow">إدارة الوصول</p><h2>الحسابات والأدوار</h2></div><button className="secondary" onClick={() => setRevision((value) => value + 1)} disabled={busy || loading}>تحديث</button></div><p className="muted">يجب أن يسجّل العضو حساباً ويؤكد بريده ويسجّل الدخول مرة واحدة قبل إضافته. الأدوار هنا خاصة بهذه الأكاديمية فقط.</p>{error && <div className="alert error" role="alert">{error}</div>}{message && <div className="alert success" role="status">{message}</div>}<form className="member-form" onSubmit={(event) => void add(event)}><label>بريد العضو<input name="email" type="email" required disabled={busy} dir="ltr" autoComplete="off" /></label><label>الدور<select name="role" defaultValue="athlete" disabled={busy}>{Object.entries(roleLabels).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label><button className="primary" type="submit" disabled={busy || loading}>{busy ? 'جارٍ التنفيذ…' : 'إضافة العضو'}</button></form>{loading ? <p role="status">جارٍ تحميل الأعضاء…</p> : <div className="table-scroll"><table><thead><tr><th>الاسم</th><th>البريد</th><th>الدور</th><th>الإجراءات</th></tr></thead><tbody>{members.map((member) => <tr key={String(member.id)}><td>{member.display_name}</td><td dir="ltr">{member.email}</td><td>{roleLabels[member.role as Role]}</td><td>{removing === member.id ? <div className="row-actions"><button className="danger" disabled={busy} onClick={() => void remove(String(member.id))}>تأكيد إزالة الوصول</button><button disabled={busy} onClick={() => setRemoving(null)}>إلغاء</button></div> : <button className="danger" disabled={busy} onClick={() => setRemoving(String(member.id))}>إزالة</button>}</td></tr>)}</tbody></table></div>}</section>
}
