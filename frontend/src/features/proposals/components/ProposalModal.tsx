'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { proposalsApi } from '@/services/api/endpoints';

export interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobRequestId: string;
  jobTitle: string;
  onSuccess: () => void;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  jobRequestId,
  jobTitle,
  onSuccess,
}) => {
  const [price, setPrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('1');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || Number(price) <= 0) {
      setError('Por favor ingresa un precio válido');
      return;
    }
    if (!message.trim()) {
      setError('Por favor escribe tu propuesta o cotización');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await proposalsApi.create({
        jobRequestId,
        price: Number(price),
        estimatedDays: Number(estimatedDays) || 1,
        message: message.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al enviar la propuesta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar Propuesta de Trabajo"
      description={`Para: "${jobTitle}"`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tu Presupuesto ($ MXN)"
            type="number"
            placeholder="ej. 1500"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Input
            label="Días Estimados"
            type="number"
            placeholder="ej. 2"
            min={1}
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
          />
        </div>

        <Textarea
          label="Mensaje o Términos de tu Cotización"
          placeholder="Explica qué incluye tu servicio, materiales, disponibilidad y garantías..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Enviar Propuesta
          </Button>
        </div>
      </form>
    </Modal>
  );
};
