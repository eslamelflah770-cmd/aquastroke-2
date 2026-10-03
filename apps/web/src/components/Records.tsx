import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { api, errorMessage, type DataRecord, type Page, type Role } from '../lib/api'
import { recordLabel, type Field, type ResourceView } from '../lib/resources'

export function Records({ view, academyId, role }: { view: ResourceView; academyId: string; role: Role }) {
  const [page, setPage] = useState<Page | null>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [editor, setEditor] = useState<DataRecord | null | undefined>()
  const [deleting, setDeleting] = useState<string | null>(null)
  const manager = role === 'admin' || role === 'coach'
  const canCreate = !view.readOnly && (manager || view.key === 'messages' || view.key === 'absence-requests' && role === 'parent')
  const canEdit = manager && !view.readOnly && !['notifications', 'messages'].includes(view.key)
  useEffect(() => {
    const controller = new AbortController()
    setBusy(true); setError('')
    api<Page>(`${view.key}?page=${pageNumber}`, { signal: controller.signal }, academyId).then((result) => {
      if (controller.signal.aborted) return
      if (result.total_pages > 0 && pageNumber > result.total_pages) { setPageNumber(result.total_pages); return }
      setPage(result)
    }).catch((failure: unknown) => { if (!controller.signal.aborted) { setPage(null); setError(errorMessage(failure)) } }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [view.key, academyId, pageNumber, revision])
  async function remove(id: string) {
    setBusy(true); setError('')
    try { await api(`${view.key}/${id}`, { method: 'DELETE' }, academyId); setDeleting(null); setRevision((value) => value + 1) }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  async function markRead(id: string) {
    setBusy(true); setError('')
    try { await api(`${view.key}/${id}`, { method: 'PATCH', body: JSON.stringify({ is_read: true }) }, academyId); setRevision((value) => value + 1) }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <section className="panel records"><div className="section-heading"><div><p className="eyebrow">بيانات الأكاديمية</p><h2>{view.label}</h2><p className="muted">{page ? `${page.total} سجل` : 'تحميل البيانات حسب صلاحياتك'}</p></div><div className="toolbar"><button className="secondary" onClick={() => setRevision((value) => value + 1)} disabled={busy} aria-label="تحديث البيانات"><RefreshCw size={16} /></button>{canCreate && <button className="primary" onClick={() => setEditor(null)} disabled={busy}><Plus size={16} />إضافة سجل</button>}</div></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {busy ? <div className="table-skeleton" aria-label="جارٍ تحميل السجلات"><div /><div /><div /></div> : page && !page.data.length ? <div className="empty"><h3>لا توجد سجلات متاحة بعد</h3><p>{canCreate ? 'أضف أول سجل من الزر أعلاه. يجب إنشاء البيانات المرتبطة أولاً.' : 'تظهر هنا البيانات التي يسمح دورك وارتباط حسابك بمشاهدتها.'}</p></div> : page && <div className="table-scroll"><table><thead><tr>{view.fields.slice(0, 6).map((field) => <th key={field.name}>{field.label}</th>)}<th>الإجراءات</th></tr></thead><tbody>{page.data.map((record) => <tr key={String(record.id)}>{view.fields.slice(0, 6).map((field) => <td key={field.name}>{field.type === 'checkbox' ? record[field.name] ? 'نعم' : 'لا' : String(record[field.name] ?? '—')}</td>)}<td><div className="row-actions">{canEdit && <><button onClick={() => setEditor(record)}>تعديل</button>{deleting === record.id ? <span className="delete-confirm">يشمل الحذف البيانات التابعة.<button className="danger" onClick={() => void remove(String(record.id))}>تأكيد الحذف</button><button onClick={() => setDeleting(null)}>إلغاء</button></span> : <button className="danger" onClick={() => setDeleting(String(record.id))}>حذف</button>}</>}{['notifications', 'messages'].includes(view.key) && !record.is_read && <button onClick={() => void markRead(String(record.id))}>تحديد كمقروء</button>}{!canEdit && !['notifications', 'messages'].includes(view.key) && <span className="muted">عرض فقط</span>}</div></td></tr>)}</tbody></table></div>}
    {page && page.total_pages > 1 && <div className="pagination"><button className="secondary" disabled={busy || pageNumber <= 1} onClick={() => setPageNumber((value) => value - 1)}>السابق</button><span>صفحة {pageNumber} من {page.total_pages}</span><button className="secondary" disabled={busy || pageNumber >= page.total_pages} onClick={() => setPageNumber((value) => value + 1)}>التالي</button></div>}
    {editor !== undefined && <RecordEditor view={view} academyId={academyId} role={role} record={editor} onClose={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setRevision((value) => value + 1) }} />}
  </section>
}

function RecordEditor({ view, academyId, role, record, onClose, onSaved }: { view: ResourceView; academyId: string; role: Role; record: DataRecord | null; onClose: () => void; onSaved: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [values, setValues] = useState<Record<string, string | boolean>>(() => Object.fromEntries(view.fields.map((field) => [field.name, field.type === 'checkbox' ? record ? Boolean(record[field.name]) : true : String(record?.[field.name] ?? '')])))
  const [references, setReferences] = useState<Record<string, DataRecord[]>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const fields = view.fields.filter((field) => !(view.key === 'absence-requests' && role === 'parent' && field.name === 'status'))
  useEffect(() => {
    dialog.current?.showModal()
    const element = dialog.current
    return () => element?.close()
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    const sources = [...new Set(view.fields.flatMap((field) => field.source ? [field.source] : []))]
    Promise.all(sources.map(async (source) => {
      if (source === 'members') return [source, await api<DataRecord[]>(`academies/${academyId}/members`, { signal: controller.signal }, academyId)] as const
      let currentPage = 1
      const records: DataRecord[] = []
      let result: Page
      do {
        result = await api<Page>(`${source}?limit=100&page=${currentPage}`, { signal: controller.signal }, academyId)
        records.push(...result.data)
        currentPage += 1
      } while (currentPage <= result.total_pages)
      return [source, records] as const
    })).then((entries) => { if (!controller.signal.aborted) setReferences(Object.fromEntries(entries)) }).catch((failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [view.key, academyId, retry])
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const input: Record<string, unknown> = {}
    for (const field of fields) {
      const value = values[field.name]
      if (field.type === 'checkbox') input[field.name] = Boolean(value)
      else if (value !== '') input[field.name] = field.type === 'number' ? Number(value) : value
      else if (field.nullable) input[field.name] = null
    }
    try { await api(`${view.key}${record ? `/${record.id}` : ''}`, { method: record ? 'PUT' : 'POST', body: JSON.stringify(input) }, academyId); onSaved() }
    catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <dialog ref={dialog} className="editor-dialog" onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}><form onSubmit={(event) => void submit(event)}><div className="section-heading"><h2>{record ? 'تعديل السجل' : 'إضافة سجل'} · {view.label}</h2><button className="secondary" type="button" onClick={onClose} disabled={busy}>إغلاق</button></div><p className="muted">الحقول المعلّمة بنجمة مطلوبة. العلاقات تخص الأكاديمية الحالية فقط.</p>{error && <div className="alert error" role="alert">{error}{!busy && <button type="button" onClick={() => setRetry((value) => value + 1)}>إعادة تحميل الخيارات</button>}</div>}{loading ? <p role="status">جارٍ تحميل البيانات المرتبطة…</p> : <div className="form-grid">{fields.map((field) => <FieldInput key={field.name} field={field} value={values[field.name]} references={references} disabled={busy} onChange={(value) => setValues((current) => ({ ...current, [field.name]: value }))} />)}</div>}<div className="form-actions"><button className="primary" type="submit" disabled={busy || loading}>{busy ? 'جارٍ الحفظ…' : 'حفظ السجل'}</button><button className="secondary" type="button" onClick={onClose} disabled={busy}>إلغاء</button></div></form></dialog>
}

function FieldInput({ field, value, references, onChange, disabled }: { field: Field; value: string | boolean; references: Record<string, DataRecord[]>; onChange: (value: string | boolean) => void; disabled: boolean }) {
  const textValue = typeof value === 'string' ? value : ''
  const options = field.source ? references[field.source] || [] : []
  const common = { required: field.required, disabled }
  return <label className={field.type === 'textarea' ? 'wide-field' : ''}>{field.label}{field.required && <span aria-hidden="true"> *</span>}
    {field.source ? <select {...common} value={textValue} onChange={(event) => onChange(event.target.value)}><option value="">اختر {field.label}</option>{textValue && !options.some((record) => String(field.source === 'members' ? record.user_id : record.id) === textValue) && <option value={textValue}>{textValue}</option>}{options.map((record) => <option key={String(record.id)} value={String(field.source === 'members' ? record.user_id : record.id)}>{recordLabel(record)}</option>)}</select> : field.type === 'select' ? <select {...common} value={textValue} onChange={(event) => onChange(event.target.value)}><option value="">اختر</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : field.type === 'textarea' ? <textarea {...common} value={textValue} maxLength={5000} rows={3} onChange={(event) => onChange(event.target.value)} /> : field.type === 'checkbox' ? <input disabled={disabled} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} /> : <input {...common} type={field.type || 'text'} value={textValue} min={field.min} max={field.max} maxLength={field.type ? undefined : 255} step={field.type === 'number' ? 'any' : undefined} onChange={(event) => onChange(event.target.value)} />}
  </label>
}
