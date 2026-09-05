'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmVariant = 'primary' | 'warning' | 'danger';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  isConfirming?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  variant = 'primary',
  isConfirming = false,
}: ConfirmModalProps) {
  const icon = variant === 'danger'
    ? <AlertTriangle className="w-6 h-6" />
    : variant === 'warning'
      ? <HelpCircle className="w-6 h-6" />
      : <CheckCircle2 className="w-6 h-6" />;

  const iconClasses = {
    primary: 'bg-brand-50 text-brand-700 border-brand-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    danger: 'bg-rose-50 text-rose-700 border-rose-100',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" hideHeader>
      <div className="text-center px-1 pb-1">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${iconClasses[variant]}`}>
          {icon}
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
