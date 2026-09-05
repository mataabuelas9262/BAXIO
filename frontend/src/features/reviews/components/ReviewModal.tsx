'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { reviewsApi } from '@/services/api/endpoints';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
  targetName: string;
  targetRole: 'profesional' | 'cliente';
  onSuccess: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  workOrderId,
  targetName,
  targetRole,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const starLabels: Record<number, string> = {
    1: '😡 Pésimo / Muy insatisfecho',
    2: '😕 Regular / Podría mejorar',
    3: '😐 Bueno / Aceptable',
    4: '😊 Muy Bueno / Recomendado',
    5: '🤩 ¡Excelente servicio y trato!',
  };

  const currentDisplayRating = hoverRating || rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      alert('Por favor selecciona una calificación de 1 a 5 estrellas');
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewsApi.create({
        workOrderId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al registrar la calificación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Calificar a ${targetName}`}
      description={`Comparte tu experiencia tras concluir esta orden de trabajo como ${targetRole === 'profesional' ? 'cliente' : 'profesional'}.`}
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Star Selector */}
        <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Calificación General
          </span>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= currentDisplayRating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 focus:outline-none transition-transform hover:scale-125 cursor-pointer"
                  aria-label={`${star} estrella${star === 1 ? '' : 's'}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      isFilled
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <span className="text-xs font-bold text-slate-700 mt-2 h-4">
            {currentDisplayRating ? starLabels[currentDisplayRating] : 'Selecciona de 1 a 5 estrellas'}
          </span>
        </div>

        {/* Comment textarea (Opcional) */}
        <Textarea
          label="Comentario o detalles de la experiencia (Opcional)"
          placeholder="ej. Llegó a tiempo, diagnóstico rápido y trabajo impecable. Muy recomendado."
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          helperText="El comentario es opcional. Las estrellas alimentan directamente la reputación."
        />

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            Publicar Calificación
          </Button>
        </div>
      </form>
    </Modal>
  );
}
