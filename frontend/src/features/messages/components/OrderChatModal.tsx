'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Ban, Copy, Flag, MessageCircle, Pencil, RefreshCw, Send, Trash2 } from 'lucide-react';
import { messagesApi } from '@/services/api/endpoints';
import { Conversation, WorkOrder } from '@/types/common.types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface OrderChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: WorkOrder | null;
  currentUserId?: string;
}

export function OrderChatModal({ isOpen, onClose, order, currentUserId }: OrderChatModalProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'report-message' | 'report-user' | 'block'; id?: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const counterpart = order && currentUserId === order.clientId ? order.worker : order?.client;

  const loadConversation = useCallback(async () => {
    if (!order) return;
    setIsLoading(true);
    setError('');
    try {
      setConversation(await messagesApi.getByWorkOrder(order.id));
    } catch (err: any) {
      setError(err.message || 'No fue posible cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, [order]);

  useEffect(() => {
    if (!isOpen) return;
    loadConversation();
    const refreshInterval = window.setInterval(loadConversation, 8000);
    return () => window.clearInterval(refreshInterval);
  }, [isOpen, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length, isOpen]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!order || !content) return;

    setIsSending(true);
    setError('');
    try {
      const message = await messagesApi.send(order.id, content);
      setConversation((current) => current
        ? { ...current, messages: [...current.messages, message] }
        : current);
      setDraft('');
    } catch (err: any) {
      setError(err.message || 'No fue posible enviar el mensaje');
    } finally {
      setIsSending(false);
    }
  };

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
      } else if (confirmAction.type === 'report-message' && confirmAction.id) {
        await messagesApi.report({ messageId: confirmAction.id, reason: 'Reporte desde conversación' });
      } else if (confirmAction.type === 'report-user' && counterpart?.id) {
        await messagesApi.report({ reportedUserId: counterpart.id, reason: 'Reporte de usuario desde conversación' });
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={`Chat con ${counterpart?.fullName || 'tu contacto'}`}
      description={order?.jobRequest?.title || 'Conversación protegida por tu orden de trabajo'}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/60 p-3">
          <Avatar src={counterpart?.avatarUrl} name={counterpart?.fullName || 'Contacto'} size="sm" />
          <p className="text-xs leading-relaxed text-brand-900">
            Este chat es privado entre las dos personas de esta orden de trabajo.
          </p>
          <div className="ml-auto flex shrink-0 gap-1">
            <button type="button" onClick={() => setConfirmAction({ type: 'report-user' })} className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-100" aria-label="Reportar usuario"><Flag className="h-4 w-4" /></button>
            <button type="button" onClick={() => setConfirmAction({ type: 'block' })} className="rounded-lg p-1.5 text-rose-700 hover:bg-rose-100" aria-label="Bloquear usuario"><Ban className="h-4 w-4" /></button>
          </div>
        </div>

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
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-3 py-2 ${isMine ? 'bg-brand-600 text-white rounded-br-md' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'}`}>
                    {!isMine && <p className="mb-0.5 text-[10px] font-bold text-brand-700">{message.sender.fullName}</p>}
                    {editingId === message.id ? (
                      <div className="space-y-2"><textarea value={editingContent} onChange={(event) => setEditingContent(event.target.value)} className="w-full rounded-lg p-2 text-sm text-slate-900" rows={2} /><div className="flex gap-2"><button type="button" onClick={updateMessage} className="text-xs font-bold">Guardar</button><button type="button" onClick={() => setEditingId(null)} className="text-xs">Cancelar</button></div></div>
                    ) : <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>}
                    <p className={`mt-1 text-[10px] ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                      {new Date(message.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className={`mt-1 flex gap-1 ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                      <button type="button" onClick={() => copyMessage(message.content)} aria-label="Copiar mensaje"><Copy className="h-3.5 w-3.5" /></button>
                      {isMine ? <><button type="button" onClick={() => { setEditingId(message.id); setEditingContent(message.content); }} aria-label="Editar mensaje"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setConfirmAction({ type: 'delete', id: message.id })} aria-label="Eliminar mensaje"><Trash2 className="h-3.5 w-3.5" /></button></> : <button type="button" onClick={() => setConfirmAction({ type: 'report-message', id: message.id })} aria-label="Reportar mensaje"><Flag className="h-3.5 w-3.5" /></button>}
                    </div>
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

        <form noValidate onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={2000}
            rows={2}
            disabled={isSending}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100"
          />
          <Button type="submit" variant="primary" isLoading={isSending} disabled={!draft.trim()} leftIcon={<Send className="h-4 w-4" />}>
            Enviar
          </Button>
        </form>

        <div className="flex justify-end">
          <button type="button" onClick={loadConversation} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-brand-700">
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
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
  );
}
