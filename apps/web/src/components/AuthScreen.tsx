import { useEffect, useState, type FormEvent } from 'react'
import { acceptInvite, getSettings, getUser, login, requestPasswordRecovery, signup, updateUser, type CallbackResult } from '@netlify/identity'
import { Waves } from 'lucide-react'
import { errorMessage } from '../lib/api'

export function AuthScreen({ initialError, callback, onComplete }: { initialError: string; callback: CallbackResult | null; onComplete: () => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(initialError)
  const [message, setMessage] = useState('')
  const [signupAllowed, setSignupAllowed] = useState(true)
  const resetting = callback?.type === 'recovery' || callback?.type === 'invite'
  useEffect(() => {
    let active = true
    getSettings().then((settings) => { if (active) setSignupAllowed(!settings.disableSignup) }).catch((failure: unknown) => { if (active) setError(errorMessage(failure)) })
    return () => { active = false }
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      if (callback?.type === 'invite') {
        if (!callback.token) throw new Error('رابط الدعوة غير مكتمل. اطلب دعوة جديدة.')
        await acceptInvite(callback.token, password); await onComplete()
      }
      else if (callback?.type === 'recovery') { await updateUser({ password }); await onComplete() }
      else if (mode === 'forgot') { await requestPasswordRecovery(email); setMessage('إذا كان البريد مرتبطاً بحساب، فستصلك رسالة لاستعادة كلمة المرور.') }
      else if (mode === 'signup') {
        await signup(email, password, { full_name: name })
        if (await getUser()) await onComplete()
        else { setMessage('أُرسل رابط التأكيد إلى بريدك. افتحه لإكمال التسجيل، ثم سجّل الدخول.'); setPassword('') }
      } else { await login(email, password); await onComplete() }
    } catch (failure) { setError(errorMessage(failure)) }
    finally { setBusy(false) }
  }
  return <main className="auth-layout" dir="rtl"><section className="auth-story"><div className="brand"><Waves /><span>AQUASTROKE<small>إدارة التدريب والسباحين</small></span></div><div><p className="eyebrow">من أول حصة إلى آخر سباق</p><h1>تدريب منظم.<br />تقدم يمكن متابعته.</h1><p>مساحة واحدة لخطط التدريب، والحضور، ونتائج السباحين، والتواصل مع أولياء الأمور.</p><span className="story-line" /></div><small>بيانات كل أكاديمية مستقلة. الصلاحيات تتحقق على الخادم.</small></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={(event) => void submit(event)}><p className="eyebrow">حسابك في الأكاديمية</p><h2>{resetting ? 'تعيين كلمة المرور' : mode === 'signup' ? 'إنشاء حساب' : mode === 'forgot' ? 'استعادة الحساب' : 'مرحباً بعودتك'}</h2><p className="muted">{resetting ? 'اختر كلمة مرور جديدة لإكمال الوصول إلى حسابك.' : 'سجّل الدخول للوصول إلى مساحة التدريب الخاصة بك.'}</p>
    {error && <div className="alert error" role="alert">{error}</div>}{message && <div className="alert success" role="status">{message}</div>}
    {!resetting && mode === 'signup' && <label>الاسم<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={255} autoComplete="name" /></label>}
    {!resetting && <label>البريد الإلكتروني<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" dir="ltr" /></label>}
    {(resetting || mode !== 'forgot') && <label>كلمة المرور<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === 'signup' || resetting ? 8 : undefined} autoComplete={mode === 'signup' || resetting ? 'new-password' : 'current-password'} dir="ltr" /></label>}
    <button className="primary full-width" disabled={busy} type="submit">{busy ? 'جارٍ التنفيذ…' : resetting ? 'حفظ كلمة المرور' : mode === 'signup' ? 'إنشاء الحساب' : mode === 'forgot' ? 'إرسال رابط الاستعادة' : 'تسجيل الدخول'}</button>
    {!resetting && <div className="auth-actions">{mode === 'login' && <button type="button" disabled={busy} onClick={() => { setMode('forgot'); setError(''); setMessage('') }}>نسيت كلمة المرور</button>}<button type="button" disabled={busy || mode === 'login' && !signupAllowed} onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>{mode === 'login' ? signupAllowed ? 'إنشاء حساب جديد' : 'التسجيل بالدعوة فقط' : 'العودة لتسجيل الدخول'}</button></div>}
  </form></section></main>
}
