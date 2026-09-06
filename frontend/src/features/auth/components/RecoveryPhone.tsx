'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/services/api/endpoints';
import { useAuth } from '@/features/auth/context/AuthContext';
import { OtpInput } from './OtpInput';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function RecoveryPhone({ verifiedPhone, twoFactor }: { verifiedPhone: string | null; twoFactor: boolean }) {
  const { refreshUser } = useAuth();
  const [available, setAvailable] = useState(false), [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState(''), [password, setPassword] = useState(''), [factor, setFactor] = useState('');
  const [token, setToken] = useState(''), [code, setCode] = useState(''), [error, setError] = useState('');
  useEffect(() => { authApi.passwordOptions().then(r => setAvailable(r.smsAvailable)).catch(() => {}); }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError('');
    try {
      if (token) { await authApi.verifyPhone(token, code); setToken(''); setCode(''); await refreshUser(); }
      else { const result = await authApi.requestPhone(phone.trim(), password, factor.trim()); setToken(result.challengeToken); setPassword(''); setFactor(''); }
    } catch(e) { setError(e instanceof Error ? e.message : 'No se pudo verificar el teléfono.'); }
    finally { setBusy(false); }
  }
  return <Card className="p-6 space-y-4"><h2 className="font-bold text-slate-900 dark:text-slate-100">Teléfono de recuperación</h2><p className="text-sm text-slate-500">{verifiedPhone ? `Número verificado: ${verifiedPhone}` : 'La recuperación por SMS requiere verificar que el número te pertenece.'}</p>{!available ? <p className="text-sm text-slate-500">SMS aún no disponible. Puedes recuperar tu contraseña por correo.</p> : <form onSubmit={submit} className="space-y-4">{error && <p role="alert" className="text-sm text-rose-500">{error}</p>}{token ? <><p className="text-sm text-slate-500">Escribe el código enviado a {phone}. Vence en 10 minutos. Al verificarlo se cerrarán tus sesiones; después inicia sesión nuevamente.</p><OtpInput value={code} onChange={setCode} disabled={busy} /></> : <><Input label="Teléfono con código de país" type="tel" placeholder="+528112345678" value={phone} onChange={e => setPhone(e.target.value)} required disabled={busy} /><Input label="Contraseña actual para verificar teléfono" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />{twoFactor && <Input label="Código de 2FA o de recuperación" value={factor} onChange={e => setFactor(e.target.value)} required disabled={busy} />}</>}<Button type="submit" isLoading={busy} disabled={busy || (!!token && code.length !== 6)}>{token ? 'Verificar teléfono' : 'Enviar SMS de verificación'}</Button>{token && <button type="button" onClick={() => { setToken(''); setCode(''); }} className="block text-sm text-brand-500" disabled={busy}>Volver a solicitar código</button>}</form>}<Link href="/auth/forgot-password" className="inline-block text-sm text-brand-600 dark:text-brand-300">Recuperar contraseña por correo</Link></Card>;
}
