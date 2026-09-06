'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Download, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { authApi, AuthStep } from '@/services/api/endpoints';
import { RecoveryPhone } from '@/features/auth/components/RecoveryPhone';
import { OtpInput } from '@/features/auth/components/OtpInput';
import { OtpChallenge } from '@/features/auth/components/OtpChallenge';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Status = Awaited<ReturnType<typeof authApi.security>>;
export default function SecurityPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [setup, setSetup] = useState<Awaited<ReturnType<typeof authApi.setup2fa>> | null>(null);
  const [password, setPassword] = useState(''), [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false), [saved, setSaved] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [challenge, setChallenge] = useState<AuthStep | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false);
  async function load() { setStatus(await authApi.security()); }
  useEffect(() => { if (user) load().catch(() => setError('No se pudo cargar la configuración de seguridad.')); }, [user?.id]);
  function reset() { setMode('idle'); setSetup(null); setPassword(''); setCode(''); setRecovery(false); setError(''); }
  async function perform(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await perform(async () => {
      if (mode === 'disable') {
        await authApi.disable2fa(password, code); reset(); await load(); await refreshUser(); setNotice('El 2FA se desactivó. Las otras sesiones quedaron cerradas.');
      } else if (!setup) { setSetup(await authApi.setup2fa(password)); setCode(''); }
      else {
        const result = await authApi.confirm2fa(password, code); setCodes(result.recoveryCodes); setSaved(false); reset(); await load(); await refreshUser();
      }
    });
  }
  function download() {
    const blob = new Blob([`BAXIO — Códigos de recuperación\nCuenta: ${user?.email}\nGuárdalos en un lugar privado. Cada código sirve una sola vez.\n\n${codes.join('\n')}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'baxio-codigos-recuperacion.txt'; a.click(); URL.revokeObjectURL(url);
  }
  if (isLoading) return <PageContainer><p>Cargando seguridad…</p></PageContainer>;
  if (!user) return <PageContainer><p>Inicia sesión para administrar la seguridad de tu cuenta.</p><Link href="/auth/login" className="text-brand-600">Iniciar sesión</Link></PageContainer>;
  return <PageContainer size="sm" className="py-8">
    <Link href="/profile" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16} />Volver a mi perfil</Link>
    <div className="mb-7"><ShieldCheck className="mb-3 text-brand-500" size={32} /><h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Seguridad de mi cuenta</h1><p className="mt-2 text-sm text-slate-500">Controla cómo verificas tu identidad al entrar a BAXIO.</p></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    {notice && <p role="status" className="mb-5 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-300">{notice}</p>}
    {codes.length > 0 ? <Card className="p-6 space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">2FA activado: guarda tus códigos</h2>
      <p className="text-sm text-slate-500">Solo se muestran esta vez. Cada código permite entrar junto con tu contraseña si pierdes el autenticador. No los compartas.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{codes.map(c => <code key={c} className="rounded-lg border border-slate-300 p-2 text-center text-xs text-slate-800 dark:text-slate-100 dark:border-slate-600">{c}</code>)}</div>
      <Button variant="outline" onClick={download} leftIcon={<Download size={16} />}>Descargar códigos</Button>
      <label className="flex gap-3 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} />Guardé mis códigos en un lugar seguro.</label>
      <Button disabled={!saved} onClick={() => { setCodes([]); setNotice('Tu cuenta ya tiene verificación en dos pasos.'); }}>Terminar</Button>
    </Card> : challenge ? <Card className="p-6"><OtpChallenge initial={challenge} onBack={() => setChallenge(null)} onDone={() => { setChallenge(null); void perform(load); }} /></Card> : mode !== 'idle' ? <Card className="p-6">
      <form onSubmit={submit} className="space-y-5">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{mode === 'disable' ? 'Desactivar verificación en dos pasos' : setup ? 'Vincula tu autenticador' : 'Activar verificación en dos pasos'}</h2>
        {mode === 'disable' && <p className="text-sm text-slate-500">Confirma tu contraseña y un código válido. Después entrarás únicamente con contraseña y se cerrarán tus otras sesiones.</p>}
        {!setup && <Input label="Contraseña actual" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />}
        {setup && <><p className="text-sm text-slate-500">Escanea el QR con tu app autenticadora. La vinculación vence en 10 minutos.</p><img src={setup.qrCode} width={224} height={224} alt="Código QR para vincular tu autenticador con BAXIO" className="mx-auto rounded-xl" /><details className="text-sm text-slate-500"><summary className="cursor-pointer">No puedo escanear el QR</summary><p className="mt-2">Añade una cuenta con esta clave, basada en tiempo:</p><code className="mt-2 block break-all rounded-lg border border-slate-300 p-3 text-slate-900 dark:text-slate-100">{setup.secret}</code></details></>}
        {(setup || mode === 'disable') && (recovery ? <Input label="Código de recuperación" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} maxLength={40} required disabled={busy} /> : <OtpInput value={code} onChange={setCode} disabled={busy} />)}
        {mode === 'disable' && <button type="button" onClick={() => { setRecovery(!recovery); setCode(''); }} className="text-sm text-brand-600 dark:text-brand-300">{recovery ? 'Usar app autenticadora' : 'Usar código de recuperación'}</button>}
        <div className="flex flex-wrap gap-3"><Button type="submit" isLoading={busy} disabled={busy || ((!!setup || mode === 'disable') && code.length < 6)}>{mode === 'disable' ? 'Confirmar desactivación' : setup ? 'Confirmar y activar 2FA' : 'Continuar'}</Button><Button variant="ghost" disabled={busy} onClick={reset}>Cancelar</Button></div>
      </form>
    </Card> : <div className="space-y-5">
      <RecoveryPhone verifiedPhone={status?.verifiedPhone || null} twoFactor={status?.twoFactorEnabled || false} />
      <Card className="p-6 space-y-4"><h2 className="font-bold text-slate-900 dark:text-slate-100">Contraseña</h2><p className="text-sm text-slate-500">Confirma tu contraseña actual para elegir una nueva. Se cerrarán tus sesiones abiertas.</p><Link href="/profile/security/password" className="inline-block font-semibold text-brand-600 dark:text-brand-300">Cambiar contraseña →</Link></Card>
      <Card className="p-6 space-y-4"><h2 className="font-bold text-slate-900 dark:text-slate-100">Correo electrónico</h2><p className="text-sm text-slate-500">{user.email}</p><p className={`text-sm ${status?.emailVerified ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500'}`}>{status?.emailVerified ? 'Correo verificado' : 'Correo pendiente de verificar'}</p>{status && !status.emailVerified && <Button variant="outline" isLoading={busy} onClick={() => perform(async () => setChallenge(await authApi.verifyEmail()))}>Verificar mi correo</Button>}</Card>
      <Card className="p-6 space-y-4"><h2 className="font-bold text-slate-900 dark:text-slate-100">Verificación en dos pasos · 2FA</h2><p className="text-sm text-slate-500">Además de tu contraseña, te pediremos un código de tu app autenticadora al iniciar sesión.</p><p className={`text-sm font-semibold ${status?.twoFactorEnabled ? 'text-emerald-600 dark:text-emerald-300' : 'text-slate-500'}`}>{status ? status.twoFactorEnabled ? `Activada · ${status.recoveryCodesRemaining} códigos de recuperación disponibles` : 'Desactivada' : 'Cargando…'}</p><Button disabled={!status || busy} onClick={() => { reset(); setMode(status?.twoFactorEnabled ? 'disable' : 'setup'); }}>{status?.twoFactorEnabled ? 'Desactivar 2FA' : 'Activar 2FA'}</Button></Card>
    </div>}
  </PageContainer>;
}
