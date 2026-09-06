'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { adminApi, AdminReport } from '@/services/api/endpoints';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const labels: Record<AdminReport['status'], string> = { PENDING: 'Pendiente', REVIEWED: 'Revisado', DISMISSED: 'Descartado' };
const tones: Record<AdminReport['status'], string> = { PENDING: 'bg-amber-500/10 text-amber-700 dark:text-amber-300', REVIEWED: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300', DISMISSED: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' };

export default function AdminReportsPage() {
  const { user, isLoading } = useAuth();
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [filter, setFilter] = useState<AdminReport['status'] | 'ALL'>('PENDING');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const load = async () => { setError(''); try { setReports(await adminApi.listReports(filter === 'ALL' ? undefined : filter)); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudieron cargar los reportes.'); } };
  useEffect(() => { if (user?.role === 'ADMIN' || user?.role === 'MODERATOR') void load(); }, [user?.id, filter]);
  const setStatus = async (id: string, status: AdminReport['status']) => { setBusy(id); setError(''); try { await adminApi.updateReport(id, status); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar el reporte.'); } finally { setBusy(null); } };

  if (isLoading) return <PageContainer><p>Cargando administración…</p></PageContainer>;
  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) return <PageContainer size="sm" className="py-12"><Card className="p-6"><ShieldAlert className="text-rose-500 mb-3" /><h1 className="text-xl font-bold">Acceso restringido</h1><p className="mt-2 text-sm text-slate-500">Esta sección es solo para cuentas de administración.</p><Link href="/" className="mt-4 inline-block text-sm font-semibold text-brand-600">Volver al inicio</Link></Card></PageContainer>;
  return <PageContainer size="lg" className="py-8">
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><ShieldAlert className="mb-3 text-brand-500" size={32} /><h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Reportes de la comunidad</h1><p className="mt-2 text-sm text-slate-500">Revisa el contexto y registra si el caso fue atendido o descartado. Esta acción no elimina cuentas ni mensajes.</p></div><Button variant="outline" onClick={() => void load()} leftIcon={<RefreshCw size={16} />}>Actualizar</Button></div>
    <div className="mb-5 flex flex-wrap gap-2">{(['PENDING', 'REVIEWED', 'DISMISSED', 'ALL'] as const).map(status => <button key={status} onClick={() => setFilter(status)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${filter === status ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{status === 'ALL' ? 'Todos' : labels[status]}</button>)}</div>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    <div className="space-y-4">{reports.length === 0 ? <Card className="p-6 text-sm text-slate-500">No hay reportes en este estado.</Card> : reports.map(report => <Card key={report.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900 dark:text-slate-100">{report.reason}</h2><p className="mt-1 text-xs text-slate-500">{new Date(report.createdAt).toLocaleString('es-MX')}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ${tones[report.status]}`}>{labels[report.status]}</span></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Quien reporta</span>{report.reporter.fullName} <span className="text-slate-500">· {report.reporter.email}</span></p><p><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Cuenta reportada</span>{report.reportedUser.fullName} <span className="text-slate-500">· {report.reportedUser.email}</span></p></div>{report.details && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">{report.details}</p>}{report.message && <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700"><span className="block text-xs font-bold uppercase tracking-wide text-slate-400">Mensaje reportado · {report.message.sender.fullName}</span><p className="mt-1 whitespace-pre-wrap">{report.message.content}</p></div>}<div className="mt-5 flex flex-wrap gap-2"><Button size="sm" disabled={busy === report.id || report.status === 'REVIEWED'} isLoading={busy === report.id} onClick={() => void setStatus(report.id, 'REVIEWED')} leftIcon={<CheckCircle2 size={15} />}>Marcar revisado</Button><Button size="sm" variant="outline" disabled={busy === report.id || report.status === 'DISMISSED'} onClick={() => void setStatus(report.id, 'DISMISSED')} leftIcon={<XCircle size={15} />}>Descartar</Button></div></Card>)}</div>
  </PageContainer>;
}
