'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authApi } from '@/services/api/endpoints';
import { OtpInput } from './OtpInput';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function getPasswordStrength(value: string) {
  if (!value) return null;

  const score = [
    value.length >= 8,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
    value.length >= 12,
  ].filter(Boolean).length;

  if (score <= 1) return { label: 'Débil', bars: 1, color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-300' };
  if (score === 2) return { label: 'Aceptable', bars: 2, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300' };
  if (score === 3) return { label: 'Fuerte', bars: 3, color: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-300' };
  return { label: 'Muy fuerte', bars: 4, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300' };
}

export function PasswordForm({ recovery = false }: { recovery?: boolean }) {
  const { user, isLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(recovery ? 'request' : 'password');
  const [email, setEmail] = useState(''), [channel, setChannel] = useState<'email' | 'sms'>('email');
  const [sms, setSms] = useState(false), [current, setCurrent] = useState('');
  const [password, setPassword] = useState(''), [confirm, setConfirm] = useState('');
  const [token, setToken] = useState(''), [code, setCode] = useState('');
  const [twoFactor, setTwoFactor] = useState(false), [factor, setFactor] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [until, setUntil] = useState(0), [seconds, setSeconds] = useState(0);
  const passwordStrength = getPasswordStrength(password);
  const lock = useRef(false);
  useEffect(() => { if (recovery) authApi.passwordOptions().then(r => setSms(r.smsAvailable)).catch(() => setSms(false)); }, [recovery]);
  useEffect(() => { const tick = () => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000))); tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer); }, [until]);
  async function perform(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function request() {
    const result = await authApi.requestPassword(email.trim(), channel);
    setToken(result.challengeToken); setNotice(result.message); setCode(''); setUntil(Date.now() + result.resendAfter * 1000); setStep('code');
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await perform(async () => {
      if (step === 'request') return request();
      if (step === 'code') {
        const result = await authApi.verifyPassword(token, code);
        setToken(result.resetToken); setTwoFactor(result.requiresTwoFactor); setCode(''); setNotice('Identidad verificada. Elige tu nueva contraseña.'); setStep('password'); return;
      }
      if (password !== confirm) throw new Error('Las contraseñas no coinciden.');
      if (password.length < 8 || new TextEncoder().encode(password).length > 72) throw new Error('Usa al menos 8 caracteres y un máximo de 72 bytes.');
      if (recovery) await authApi.resetPassword(token, password, factor.trim());
      else await authApi.changePassword(current, password);
      setPassword(''); setCurrent(''); setConfirm(''); setFactor(''); setToken(''); setNotice(''); setStep('done'); await refreshUser();
    });
  }
  if (!recovery && step !== 'done' && (isLoading || !user)) return <PageContainer><p>{isLoading ? 'Cargando…' : 'Inicia sesión para cambiar tu contraseña.'}</p>{!isLoading && <Link href="/auth/login">Iniciar sesión</Link>}</PageContainer>;
  return <PageContainer size="sm" className="py-10 flex justify-center"><Card className="w-full max-w-md p-6 sm:p-8 space-y-5">
    {step === 'done' ? <><CheckCircle2 size={40} className="text-emerald-500" /><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Contraseña actualizada</h1><p className="text-sm text-slate-500">Tus sesiones anteriores quedaron cerradas. Ya puedes entrar con tu nueva contraseña{twoFactor ? ' y tu segundo factor' : ''}.</p><Link href="/auth/login" className="inline-block font-bold text-brand-600 dark:text-brand-300">Iniciar sesión</Link></> : <>
      <LockKeyhole size={32} className="text-brand-500" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{step === 'code' ? 'Verifica tu identidad' : recovery ? 'Recuperar contraseña' : 'Cambiar contraseña'}</h1>
      <p className="text-sm text-slate-500">{step === 'request' ? 'Introduce el correo de tu cuenta para solicitar un código.' : step === 'code' ? `Revisa ${channel === 'email' ? 'tu correo y la carpeta de spam' : 'los SMS de tu teléfono verificado'}. El código vence en 10 minutos.` : 'Elige una contraseña diferente, de al menos 8 caracteres. Al guardarla se cerrarán tus sesiones.'}</p>
      {notice && <p role="status" className="rounded-xl bg-brand-500/10 p-3 text-sm text-brand-700 dark:text-brand-200">{notice}</p>}
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
      <form onSubmit={submit} className="space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          {step === 'request' && <><Input label="Correo electrónico" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={191} /><fieldset className="space-y-2 text-sm text-slate-700 dark:text-slate-200"><legend className="mb-2 font-semibold">Recibir código por</legend><label className="flex gap-2"><input type="radio" name="channel" checked={channel === 'email'} onChange={() => setChannel('email')} />Correo electrónico</label><label className={`flex gap-2 ${!sms ? 'opacity-50' : ''}`}><input type="radio" name="channel" disabled={!sms} checked={channel === 'sms'} onChange={() => setChannel('sms')} />SMS {sms ? '(teléfono verificado)' : '(aún no disponible)'}</label></fieldset></>}
          {step === 'code' && <OtpInput value={code} onChange={setCode} disabled={busy} />}
          {step === 'password' && <>{!recovery && <Input label="Contraseña actual" type="password" autoComplete="current-password" value={current} onChange={e => setCurrent(e.target.value)} required />}<div className="space-y-2"><Input label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required />{passwordStrength && <div aria-live="polite" className="space-y-1.5"><div className="flex items-center justify-between text-xs"><span className="text-slate-500 dark:text-slate-400">Seguridad de la contraseña</span><span className={`font-semibold ${passwordStrength.text}`}>{passwordStrength.label}</span></div><div className="grid grid-cols-4 gap-1" aria-label={`Seguridad: ${passwordStrength.label}`}><span className={`h-1.5 rounded-full ${passwordStrength.bars >= 1 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} /><span className={`h-1.5 rounded-full ${passwordStrength.bars >= 2 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} /><span className={`h-1.5 rounded-full ${passwordStrength.bars >= 3 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} /><span className={`h-1.5 rounded-full ${passwordStrength.bars >= 4 ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'}`} /></div><p className="text-[11px] text-slate-500 dark:text-slate-400">Usa 8 o más caracteres y combina mayúsculas, números y símbolos.</p></div>}</div><Input label="Confirmar nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={confirm} onChange={e => setConfirm(e.target.value)} required />{twoFactor && <><p className="text-sm text-slate-500">Tu cuenta tiene 2FA. Confirma también un código de tu app autenticadora o uno de tus códigos de recuperación.</p><Input label="Código de 2FA o de recuperación" autoComplete="off" value={factor} onChange={e => setFactor(e.target.value)} maxLength={40} required /></>}</>}
          <Button type="submit" className="w-full" isLoading={busy} disabled={busy || (step === 'code' && code.length !== 6)}>{step === 'request' ? 'Enviar código' : step === 'code' ? 'Verificar código' : 'Guardar contraseña'}</Button>
        </fieldset>
      </form>
      {step === 'code' && <div className="space-y-3"><button disabled={busy || seconds > 0} onClick={() => perform(request)} className="text-sm text-brand-600 dark:text-brand-300 disabled:opacity-50">{seconds > 0 ? `Reenviar en ${seconds} s` : 'Reenviar código'}</button><button disabled={busy} onClick={() => { setStep('request'); setToken(''); setNotice(''); setError(''); }} className="block text-sm text-slate-500">Cambiar correo o canal</button></div>}
      <Link href={recovery ? '/auth/login' : '/profile/security'} className="block text-sm text-slate-500">← {recovery ? 'Volver a iniciar sesión' : 'Volver a Seguridad'}</Link>
    </>}
  </Card></PageContainer>;
}
