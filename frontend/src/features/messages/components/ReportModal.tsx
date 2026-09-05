'use client';
import { FormEvent, useRef, useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { messagesApi } from '@/services/api/endpoints';

export type ReportTarget = { type: 'user' | 'message'; id: string; name: string; preview?: string };
const reasons = ['Spam o publicidad no solicitada', 'Acoso o amenazas', 'Intento de estafa', 'Contenido inapropiado', 'Otro'];

export function ReportModal({ target, onClose, onSent }: { target: ReportTarget; onClose: () => void; onSent: () => void }) {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (!reason) { setError('Selecciona un motivo para el reporte.'); return; }
    if (reason === 'Otro' && !details.trim()) { setError('Explica brevemente el motivo del reporte.'); return; }
    submitting.current = true; setIsSubmitting(true); setError('');
    try {
      await messagesApi.report({ ...(target.type === 'message' ? { messageId: target.id } : { reportedUserId: target.id }), reason, details: details.trim() || undefined });
      onSent();
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo enviar el reporte. Inténtalo de nuevo.'); }
    finally { submitting.current = false; setIsSubmitting(false); }
  }
  return <Modal isOpen onClose={() => { if (!submitting.current) onClose(); }} title={target.type === 'message' ? 'Reportar mensaje' : 'Reportar usuario'} description={target.type === 'message' ? `Mensaje de ${target.name}` : target.name} maxWidth="md">
    <form onSubmit={submit} noValidate className="space-y-4">
      {target.preview && <blockquote className="max-h-24 overflow-auto break-words rounded-xl border-l-2 border-brand-400 bg-brand-50 p-3 text-xs text-brand-900 dark:bg-brand-950/40 dark:text-brand-200">{target.preview}</blockquote>}
      <fieldset disabled={isSubmitting} className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-slate-800">¿Cuál es el motivo?</legend>
        {reasons.map((option, index) => <label key={option} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${reason === option ? 'border-brand-400 bg-brand-50 text-brand-900 dark:bg-brand-950/40 dark:text-brand-200' : 'border-slate-200 text-slate-700 hover:border-brand-300'}`}>
          <input autoFocus={index === 0} type="radio" name="report-reason" value={option} checked={reason === option} onChange={() => { setReason(option); setError(''); }} className="h-4 w-4 shrink-0 accent-brand-600" />{option}
        </label>)}
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor="report-details" className="block text-xs font-semibold text-slate-700">{reason === 'Otro' ? 'Cuéntanos qué ocurrió *' : 'Cuéntanos qué ocurrió (opcional)'}</label>
        <textarea id="report-details" value={details} onChange={event => setDetails(event.target.value)} maxLength={1000} rows={3} disabled={isSubmitting} placeholder="Describe lo sucedido para ayudar a revisar el reporte." className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-400" />
        <p className="text-right text-xs text-slate-500">{details.length}/1000</p>
      </div>
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
      <p className="text-xs text-slate-500">Tu reporte quedará registrado para revisión. Reportar no bloquea al usuario.</p>
      <div className="flex justify-end gap-3"><Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button><Button type="submit" isLoading={isSubmitting} leftIcon={<Flag className="h-4 w-4" />}>Enviar reporte</Button></div>
    </form>
  </Modal>;
}
