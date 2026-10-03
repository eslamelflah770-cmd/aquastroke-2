import { useCallback, useEffect, useState } from 'react'
import { getUser, handleAuthCallback, onAuthChange, logout, type User, type CallbackResult } from '@netlify/identity'
import { Activity, ArrowLeft, CalendarDays, LayoutDashboard, LogOut, Settings, Users, Waves } from 'lucide-react'
import { api, errorMessage, type Academy, type Profile, type Role, type Stats } from './lib/api'
import { roleLabels, views } from './lib/resources'
import { AuthScreen } from './components/AuthScreen'
import { Records } from './components/Records'
import { Members, AcademyForm } from './components/Workspace'

let initialization: Promise<{ callback: CallbackResult | null; user: User | null }> | undefined

function initializeAuth() {
  initialization ??= (async () => {
    const callback = await handleAuthCallback()
    return { callback, user: await getUser() }
  })()
  return initialization
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [callback, setCallback] = useState<CallbackResult | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [academies, setAcademies] = useState<Academy[]>([])
  const [academyId, setAcademyId] = useState('')
  const [section, setSection] = useState('dashboard')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [creatingAcademy, setCreatingAcademy] = useState(false)

  useEffect(() => {
    let active = true
    const unsubscribe = onAuthChange((_event, currentUser) => {
      if (active) setUser(currentUser)
    })
    initializeAuth().then((result) => {
      if (!active) return
      setUser(result.user)
      setCallback(result.callback)
    }).catch((failure: unknown) => { if (active) setError(errorMessage(failure)) }).finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false; unsubscribe() }
  }, [])

  const loadWorkspace = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError('')
    try {
      const [currentProfile, academyList] = await Promise.all([api<Profile>('me', { signal }), api<Academy[]>('academies', { signal })])
      if (signal?.aborted) return
      setProfile(currentProfile)
      setAcademies(academyList)
      setAcademyId((current) => academyList.some((academy) => academy.id === current) ? current : academyList[0]?.id || '')
    } catch (failure) { if (!signal?.aborted) setError(errorMessage(failure)) }
    finally { if (!signal?.aborted) setLoading(false) }
  }, [])

  useEffect(() => {
    setProfile(null)
    setAcademies([])
    setAcademyId('')
    setSection('dashboard')
    if (!user) return
    const controller = new AbortController()
    void loadWorkspace(controller.signal)
    return () => controller.abort()
  }, [user?.id, loadWorkspace])

  const role: Role | undefined = profile?.platform_admin ? 'admin' : profile?.memberships.find((membership) => membership.academy_id === academyId)?.role
  const academy = academies.find((record) => record.id === academyId)
  const manager = role === 'admin' || role === 'coach'
  const needsPassword = callback?.type === 'recovery' || callback?.type === 'invite'

  if (authLoading) return <div className="startup" dir="rtl"><Waves size={42} /><p>جارٍ التحقق من الجلسة…</p></div>
  if (!user || needsPassword) return <AuthScreen initialError={error} callback={callback} onComplete={async () => { setCallback(null); setUser(await getUser()); setError('') }} />

  return <div className="workspace" dir="rtl">
    <aside className="sidebar">
      <a className="brand" href="/" onClick={(event) => { event.preventDefault(); setSection('dashboard') }}><Waves /><span>AQUASTROKE<small>إدارة التدريب والسباحين</small></span></a>
      <label className="academy-select">الأكاديمية<select value={academyId} onChange={(event) => { setAcademyId(event.target.value); setSection('dashboard') }} disabled={loading || !academies.length}>
        {!academies.length && <option value="">لا توجد أكاديمية بعد</option>}
        {academies.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
      </select></label>
      <button className="create-academy" onClick={() => setCreatingAcademy(true)}>إنشاء أكاديمية جديدة</button>
      <nav aria-label="أقسام إدارة التدريب">
        <button className={section === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setSection('dashboard')}><LayoutDashboard size={18} />نظرة عامة</button>
        <p className="nav-caption">التدريب والبيانات</p>
        {views.filter((view) => !view.roles || role && view.roles.includes(role)).map((view) => <button key={view.key} className={section === view.key ? 'nav-item active' : 'nav-item'} onClick={() => setSection(view.key)}>{view.label}</button>)}
        {role === 'admin' && <><p className="nav-caption">الإدارة</p><button className={section === 'members' ? 'nav-item active' : 'nav-item'} onClick={() => setSection('members')}><Users size={18} />الحسابات والأدوار</button><button className={section === 'settings' ? 'nav-item active' : 'nav-item'} onClick={() => setSection('settings')}><Settings size={18} />إعدادات الأكاديمية</button></>}
      </nav>
      <div className="account"><strong>{profile?.display_name || user.name || user.email}</strong><small>{role ? roleLabels[role] : 'حساب مسجّل'}</small><button onClick={async () => { try { await logout(); setUser(null); setError('') } catch (failure) { setError(errorMessage(failure)) } }}><LogOut size={16} />تسجيل الخروج</button></div>
    </aside>
    <main className="main-content">
      <header className="page-header"><div><p className="eyebrow">مساحة التدريب</p><h1>{academy?.name || 'مرحباً بك في AQUASTROKE'}</h1></div><span className="connection"><span />Netlify · مساحة بيانات مستقلة</span></header>
      {error && <div className="alert error" role="alert">{error}<button onClick={() => void loadWorkspace()}>إعادة المحاولة</button></div>}
      {loading ? <div className="skeleton-grid" aria-label="جارٍ تحميل الأكاديمية"><div /><div /><div /></div> : !profile ? <div className="empty"><Activity /><h2>تعذر تحميل مساحة الحساب</h2><p>تحقق من الاتصال وخدمة البيانات، ثم أعد المحاولة.</p></div> : !academyId || !role ? <div className="empty"><Waves size={40} /><h2>تبدأ رحلتك بأكاديمية</h2><p>أنشئ أكاديميتك، أو اطلب من مدير أكاديمية موجودة إضافة بريد حسابك إلى أعضائها.</p><button className="primary" onClick={() => setCreatingAcademy(true)}>إنشاء الأكاديمية</button><button className="secondary" onClick={() => void loadWorkspace()}>تحديث العضوية</button></div> : <div key={`${user.id}:${academyId}`}>
        {section === 'dashboard' && <Dashboard academyId={academyId} manager={manager} navigate={setSection} />}
        {section === 'members' && role === 'admin' && <Members academyId={academyId} />}
        {section === 'settings' && role === 'admin' && academy && <section className="panel"><h2>إعدادات الأكاديمية</h2><AcademyForm academy={academy} onSaved={async () => { await loadWorkspace() }} /></section>}
        {views.filter((view) => view.key === section).map((view) => <Records key={view.key} view={view} academyId={academyId} role={role} />)}
      </div>}
    </main>
    {creatingAcademy && <div className="inline-create" role="region" aria-label="إنشاء أكاديمية"><div className="panel"><div className="section-heading"><h2>أكاديمية جديدة</h2><button className="secondary" onClick={() => setCreatingAcademy(false)}>إغلاق</button></div><p className="muted">يصبح حسابك مدير هذه الأكاديمية فقط. لا تُمنح صلاحيات على أكاديميات الآخرين.</p><AcademyForm onSaved={async (created) => { setCreatingAcademy(false); await loadWorkspace(); setAcademyId(created.id); setSection('dashboard') }} /></div></div>}
  </div>
}

function Dashboard({ academyId, manager, navigate }: { academyId: string; manager: boolean; navigate: (section: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError('')
    api<Stats>('stats', { signal: controller.signal }, academyId).then(setStats).catch((failure: unknown) => { if (!controller.signal.aborted) setError(errorMessage(failure)) })
    return () => controller.abort()
  }, [academyId, revision])
  const metrics = [{ key: 'athletes', label: manager ? 'السباحون' : 'السباحون المرتبطون بحسابك', icon: Users }, { key: 'coaches', label: 'المدربون', icon: Activity }, { key: 'sessions', label: 'الحصص التدريبية', icon: CalendarDays }, { key: 'weekly_plans', label: 'الخطط الأسبوعية', icon: Waves }] as const
  return <>
    <section className="overview"><div><p className="eyebrow">خطة واضحة. متابعة أفضل.</p><h2>كل تفاصيل التدريب<br />في مساحة واحدة.</h2><p>الخطط والحضور والنتائج مرتبطة بأكاديميتك وبصلاحيات حسابك.</p><button className="primary" onClick={() => navigate('weekly-plans')}>استعراض الخطط <ArrowLeft size={17} /></button></div><Waves className="overview-art" aria-hidden="true" /></section>
    {error && <div className="alert error" role="alert">{error}<button onClick={() => setRevision((value) => value + 1)}>إعادة المحاولة</button></div>}
    <section className="metric-grid" aria-label="إحصاءات الأكاديمية">{metrics.map((metric) => <button className="metric" key={metric.key} onClick={() => navigate(metric.key === 'weekly_plans' ? 'weekly-plans' : metric.key)}><metric.icon size={21} /><span>{metric.label}</span><strong>{stats ? stats[metric.key] : '—'}</strong></button>)}</section>
    <section className="panel"><h2>{manager ? 'ابدأ تجهيز الموسم' : 'تابع برنامج التدريب'}</h2><p className="muted">{manager ? 'أضف الأعضاء وحدّد أدوارهم، ثم سجّل المدربين والسباحين. أنشئ موسماً وخطة أسبوعية قبل إضافة الحصص والتمارين.' : 'يمكنك مشاهدة البرنامج والبيانات المسموح بها فقط. يربط مدير الأكاديمية حسابك بملف السباح أو ولي الأمر.'}</p><div className="quick-actions"><button className="secondary" onClick={() => navigate('seasons')}>المواسم</button><button className="secondary" onClick={() => navigate('attendance')}>الحضور</button><button className="secondary" onClick={() => navigate('trial-results')}>نتائج الاختبارات</button><button className="secondary" onClick={() => navigate('messages')}>الرسائل</button></div></section>
  </>
}
