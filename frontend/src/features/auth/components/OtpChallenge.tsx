'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Check, ShieldCheck, Mail } from 'lucide-react';
import { AuthStep, authApi } from '@/services/api/endpoints';
import { useAuth } from '@/features/auth/context/AuthContext';
import { OtpInput } from './OtpInput';
import { Button } from '@/components/ui/Button';

export function OtpChallenge({ initial, onDone, onBack }: { initial: AuthStep; onDone: () => void; onBack: () => void }) {
  const { verifyChallenge } = useAuth();
  const [step, setStep] = useState(initial);
  const [code, setCode] = useState(''), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [success, setSuccess] = useState(false), [recovery, setRecovery] = useState(false);
  const [remaining, setRemaining] = useState(initial.resendAfter);
  const inFlight = useRef(false);
  const successTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(successTimer.current), []);
  useEffect(() => { if (remaining <= 0) return; const timer = setTimeout(() => setRemaining(n => n - 1), 1000); return () => clearTimeout(timer); }, [remaining]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const result = await verifyChallenge(step.challengeToken, code.trim());
      if ('step' in result) { setStep(result); setCode(''); setRecovery(false); setRemaining(result.resendAfter); }
      else { setSuccess(true); successTimer.current = setTimeout(onDone, 600); }
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo verificar el código.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  async function resend() {
    if (inFlight.current || remaining > 0) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const next = await authApi.resend(step.challengeToken); setStep(next); setCode(''); setRemaining(next.resendAfter); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reenviar.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (success) return <div className="text-center py-12 space-y-5" role="status"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400 bg-emerald-500/10 text-emerald-500 shadow-[0_0_28px_#10b98144]"><Check size={30} /></div><h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verificación completada</h2><p className="text-sm text-slate-500">Todo listo para continuar.</p></div>;
  return <form onSubmit={submit} className="space-y-5 text-center">
    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">{step.step === 'email' ? <Mail /> : <ShieldCheck />}</div>
    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{step.step === 'email' ? 'Verifica tu correo' : 'Verificación en dos pasos'}</h2>
    <p className="text-sm text-slate-500 dark:text-slate-400">{step.step === 'email' ? step.delivery === 'preview' ? `Prueba local para ${step.maskedEmail}. El código se guardó en la bandeja local; no se envió un correo real.` : `Escribe el código que enviamos a ${step.maskedEmail}. Vence en 10 minutos.` : recovery ? 'Escribe uno de tus códigos de recuperación. Solo se puede usar una vez.' : 'Escribe el código de 6 dígitos de tu app autenticadora.'}</p>
    {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    {recovery ? <label className="block text-left text-sm text-slate-600 dark:text-slate-300">Código de recuperación<input className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent px-3 py-3 font-mono dark:border-slate-600" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} maxLength={40} disabled={busy} autoFocus /></label> : <OtpInput value={code} onChange={setCode} disabled={busy} />}
    <Button type="submit" className="w-full" isLoading={busy} disabled={busy || (!recovery && code.length !== 6) || (recovery && code.trim().length < 20)}>Verificar y continuar</Button>
    {step.step === 'email' ? <button type="button" className="text-sm font-semibold text-brand-600 dark:text-brand-300 disabled:opacity-50" onClick={resend} disabled={busy || remaining > 0}>{remaining > 0 ? `Reenviar código en ${remaining} s` : 'Reenviar código'}</button> : <button type="button" disabled={busy} className="text-sm text-brand-600 dark:text-brand-300" onClick={() => { setRecovery(!recovery); setCode(''); setError(''); }}>{recovery ? 'Usar mi app autenticadora' : 'Usar un código de recuperación'}</button>}
    <div><button type="button" disabled={busy} className="text-sm text-slate-500" onClick={onBack}>Volver</button></div>
  </form>;
}
