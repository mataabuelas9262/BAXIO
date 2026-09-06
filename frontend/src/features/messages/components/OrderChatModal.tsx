'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ban, Camera, Check, CheckCheck, Copy, FileUp, Flag, Image, MessageCircle, MoreHorizontal, Paperclip, Pencil, Send, Trash2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { messagesApi, uploadsApi } from '@/services/api/endpoints';
import { Conversation, WorkOrder } from '@/types/common.types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ReportModal, ReportTarget } from './ReportModal';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: WorkOrder | null;
  directUser?: { id: string; fullName: string; avatarUrl?: string | null; location?: string | null; lastSeenAt?: string | null } | null;
  currentUserId?: string;
}

export function OrderChatModal({ isOpen, onClose, order = null, directUser = null, currentUserId }: OrderChatModalProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'block'; id?: string } | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const [reportNotice, setReportNotice] = useState('');
  const [counterpartOnline, setCounterpartOnline] = useState(false);
  const [counterpartTyping, setCounterpartTyping] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string; filename: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const counterpart = directUser || (order && currentUserId === order.clientId ? order.worker : order?.client);
  const conversationKey = order?.id || directUser?.id;

  useEffect(() => {
    setReportTarget(null);
    setReportNotice('');
  }, [conversationKey, isOpen]);

  const loadConversation = useCallback(async () => {
    if (!order && !directUser) return;
    setIsLoading(true);
    setError('');
    try {
      setConversation(order ? await messagesApi.getByWorkOrder(order.id) : await messagesApi.getDirect(directUser!.id));
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, [order, directUser]);

  useEffect(() => {
    if (!isOpen) return;
    loadConversation();
    const refreshInterval = window.setInterval(loadConversation, 8000);
    return () => window.clearInterval(refreshInterval);
  }, [isOpen, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, isOpen]);

  const appendMessage = useCallback((message: Conversation['messages'][number]) => {
    setConversation((current) => current && current.messages.some((entry) => entry.id === message.id)
      ? current
      : current ? { ...current, messages: [...current.messages, message] } : current);
  }, []);

  useEffect(() => {
    if (!isOpen || !counterpart?.id) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const socketBase = apiUrl.startsWith('/') ? window.location.origin : new URL(apiUrl).origin;
    const socket = io(`${socketBase}/chat`, { path: '/socket.io', withCredentials: true, transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('chat:watch', { userId: counterpart.id }));
    socket.on('chat:presence', (event: { userId: string; online: boolean }) => {
      if (event.userId === counterpart.id) setCounterpartOnline(event.online);
    });
    socket.on('chat:typing', (event: { userId: string; isTyping: boolean }) => {
      if (event.userId === counterpart.id) setCounterpartTyping(event.isTyping);
    });
    socket.on('chat:message', (event: { kind: 'direct' | 'work-order'; counterpartId?: string; workOrderId?: string; message: Conversation['messages'][number] }) => {
      if ((directUser && event.kind === 'direct' && event.counterpartId === directUser.id) || (order && event.kind === 'work-order' && event.workOrderId === order.id)) appendMessage(event.message);
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [isOpen, counterpart?.id, directUser?.id, order?.id, appendMessage]);

  const sendMessage = async () => {
    const content = draft.trim() || (attachment ? `📎 ${attachment.filename}\n${attachment.url}` : '');
    if ((!order && !directUser) || !content) return;

    setIsSending(true);
    setError('');
    try {
      const message = order ? await messagesApi.send(order.id, content) : await messagesApi.sendDirect(directUser!.id, content);
      appendMessage(message);
      setDraft('');
      setAttachment(null);
      socketRef.current?.emit('chat:typing', { counterpartId: counterpart?.id, isTyping: false });
    } catch (err: any) {
      setError(err.message || 'No fue posible enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const attachFile = async (file?: File, imageOnly = false) => {
    if (!file) return;
    setIsSending(true); setError('');
    try {
      const result = imageOnly ? await uploadsApi.uploadImage(file) : await uploadsApi.uploadEvidence(file);
      setAttachment({ url: result.url, filename: file.name });
    } catch (err: any) { setError(err.message || 'No fue posible adjuntar el archivo'); }
    finally { setIsSending(false); }
  };

  const handleSend = (event: React.FormEvent) => { event.preventDefault(); void sendMessage(); };
  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!counterpart?.id) return;
    socketRef.current?.emit('chat:typing', { counterpartId: counterpart.id, isTyping: Boolean(value.trim()) });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => socketRef.current?.emit('chat:typing', { counterpartId: counterpart.id, isTyping: false }), 1200);
  };

  const presenceLabel = counterpartTyping ? 'Escribiendo…' : counterpartOnline ? 'En línea' : directUser?.lastSeenAt ? `Última vez ${new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(directUser.lastSeenAt))}` : 'Desconectado';

  const updateMessage = async () => {
    if (!editingId || !editingContent.trim()) return;
    try {
      const updated = await messagesApi.update(editingId, editingContent.trim());
      setConversation((current) => current ? { ...current, messages: current.messages.map((message) => message.id === updated.id ? updated : message) } : current);
      setEditingId(null);
    } catch (err: any) { setError(err.message || 'No fue posible editar el mensaje'); }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'delete' && confirmAction.id) {
        await messagesApi.delete(confirmAction.id);
        setConversation((current) => current ? { ...current, messages: current.messages.filter((message) => message.id !== confirmAction.id) } : current);
      } else if (confirmAction.type === 'block' && counterpart?.id) {
        await messagesApi.block(counterpart.id);
        onClose();
      }
    } catch (err: any) { setError(err.message || 'No fue posible completar la acción'); }
    finally { setConfirmAction(null); }
  };

  const copyMessage = async (content: string) => {
    try { await navigator.clipboard.writeText(content); } catch { setError('No fue posible copiar el mensaje'); }
  };

  return (
    <>
    <Modal
      isOpen={isOpen && !reportTarget}
      onClose={onClose}
      maxWidth="md"
      title={`Chat con ${counterpart?.fullName || 'tu contacto'}`}
      description={order?.jobRequest?.title || (directUser ? 'Consulta directa y privada dentro de BAXIO' : 'Conversación protegida por tu orden de trabajo')}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <Avatar src={counterpart?.avatarUrl} name={counterpart?.fullName || 'Contacto'} size="sm" />
          <div className="text-xs leading-relaxed text-brand-900"><p>{directUser ? 'Este chat es privado entre las dos personas. Formalicen una orden cuando acuerden los detalles.' : 'Este chat es privado entre las dos personas de esta orden de trabajo.'}</p><p className="mt-1 font-semibold text-brand-700" aria-live="polite">{presenceLabel}</p></div>
          <div className="ml-auto flex shrink-0 gap-1">
            <button type="button" disabled={!counterpart?.id} onClick={() => { if (counterpart) { setReportNotice(''); setReportTarget({ type: 'user', id: counterpart.id, name: counterpart.fullName }); } }} className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950/40" aria-label="Reportar usuario"><Flag className="h-4 w-4" /></button>
            <button type="button" onClick={() => setConfirmAction({ type: 'block' })} className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-100" aria-label="Bloquear usuario"><Ban className="h-4 w-4" /></button>
          </div>
        </div>

        {reportNotice && <p role="status" className="rounded-xl border border-emerald-300/40 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">{reportNotice}</p>}
        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
            {error}
          </p>
        )}

        <div className="h-72 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-2.5">
          {isLoading && !conversation ? (
            <p className="py-20 text-center text-sm text-slate-500">Cargando conversación...</p>
          ) : conversation?.messages.length ? (
            conversation.messages.map((message) => {
              const isMine = message.senderId === currentUserId;
              return (
                <div key={message.id} className={`group flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? 'bg-gradient-to-br from-sky-500 to-brand-700 text-white shadow-lg shadow-brand-950/30 rounded-br-md' : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-md'}`}>
                    {!isMine && <p className="mb-0.5 text-[10px] font-bold text-brand-700">{message.sender.fullName}</p>}
                    {editingId === message.id ? (
                      <div className="space-y-2"><textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} className="w-full rounded-lg p-2 text-sm text-slate-900" rows={2} /><div className="flex gap-2"><button type="button" onClick={updateMessage} className="text-xs font-bold">Guardar</button><button type="button" onClick={() => setEditingId(null)} className="text-xs">Cancelar</button></div></div>
                    ) : <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>}
                    <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? 'text-brand-100' : 'text-slate-400'}`}><span>{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(message.createdAt))}</span>{isMine && (message.isRead ? <CheckCheck className="h-3.5 w-3.5 text-sky-100" aria-label="Leído" /> : <Check className="h-3.5 w-3.5" aria-label="Enviado" />)}</div>
                    <details className="absolute -top-2 right-1"><summary className="cursor-pointer list-none rounded-full bg-slate-950/50 p-1 text-white opacity-0 transition group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute right-0 z-10 mt-1 flex gap-1 rounded-lg bg-slate-950 p-1 text-white shadow-xl"><button type="button" onClick={() => copyMessage(message.content)}><Copy className="h-3.5 w-3.5" /></button>{isMine ? <><button type="button" onClick={() => { setEditingId(message.id); setEditingContent(message.content); }}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setConfirmAction({ type: 'delete', id: message.id })}><Trash2 className="h-3.5 w-3.5" /></button></> : <button type="button" onClick={() => { setReportNotice(''); setReportTarget({ type: 'message', id: message.id, name: message.sender.fullName, preview: message.content }); }}><Flag className="h-3.5 w-3.5" /></button>}</div></details>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
              <MessageCircle className="h-7 w-7 text-slate-300" />
              <p className="text-sm font-medium">Aún no hay mensajes</p>
              <p className="text-xs">Escribe para coordinar los detalles del trabajo.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form noValidate onSubmit={handleSend} className="rounded-2xl border border-brand-400/30 bg-slate-900/80 p-2 shadow-lg shadow-brand-950/30"><div className="flex items-end gap-2">
          <div className="flex gap-1 pb-1 text-brand-200"><label className="cursor-pointer rounded-lg p-2 hover:bg-brand-500/20"><Paperclip className="h-4 w-4"/><input hidden type="file" accept="image/*,.pdf" onChange={(e) => void attachFile(e.target.files?.[0])}/></label><label className="cursor-pointer rounded-lg p-2 hover:bg-brand-500/20"><Image className="h-4 w-4"/><input hidden type="file" accept="image/*" onChange={(e) => void attachFile(e.target.files?.[0], true)}/></label><label className="cursor-pointer rounded-lg p-2 hover:bg-brand-500/20"><Camera className="h-4 w-4"/><input hidden type="file" accept="image/*" capture="environment" onChange={(e) => void attachFile(e.target.files?.[0], true)}/></label></div>
          <textarea
            value={draft}
            onChange={(event) => handleDraftChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
            placeholder="Escribe un mensaje..."
            maxLength={2000}
            rows={2}
            disabled={isSending}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
          />
          <Button type="submit" variant="primary" isLoading={isSending} disabled={!draft.trim() && !attachment} leftIcon={<Send className="h-4 w-4" />}>
            Enviar
          </Button>
        </div></form>

      </div>
      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        title={confirmAction?.type === 'delete' ? '¿Eliminar mensaje?' : confirmAction?.type === 'block' ? `¿Bloquear a ${counterpart?.fullName || 'este usuario'}?` : '¿Enviar reporte?'}
        description={confirmAction?.type === 'delete' ? 'Esta acción no se puede deshacer.' : confirmAction?.type === 'block' ? 'No podrán enviarse nuevos mensajes entre ustedes.' : 'El reporte quedará registrado para revisión.'}
        confirmLabel={confirmAction?.type === 'delete' ? 'Eliminar' : confirmAction?.type === 'block' ? 'Bloquear usuario' : 'Enviar reporte'}
        variant={confirmAction?.type === 'delete' || confirmAction?.type === 'block' ? 'danger' : 'warning'}
      />
    </Modal>
    {isOpen && reportTarget && <ReportModal target={reportTarget} onClose={() => setReportTarget(null)} onSent={() => { setReportTarget(null); setReportNotice('Reporte enviado. Quedó registrado para revisión.'); }} />}
    </>
  );
}
