'use client';

import React from 'react';
import Link from 'next/link';
import { Info, MessageCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import { ServicePricingType } from '@/types/common.types';

interface DirectContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    location?: string | null;
  };
  contextTitle?: string;
  pricingType?: ServicePricingType;
  priceLabel?: string;
}

export function DirectContactModal({
  isOpen,
  onClose,
  user,
  contextTitle,
  pricingType,
  priceLabel,
}: DirectContactModalProps) {
  const isFixedPrice = pricingType === 'FIXED';
  const isQuoteRequired = pricingType === 'STARTING_AT' || pricingType === 'CUSTOM_QUOTE';
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isQuoteRequired ? 'Solicitar cotización' : 'Contactar'} a ${user.fullName}`}
      description="Mantén la contratación y el seguimiento dentro de BAXIO"
    >
      <div className="space-y-5 pt-2">
        {/* User Card */}
        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
          <Avatar src={user.avatarUrl} name={user.fullName} size="md" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-slate-900 truncate">
              {user.fullName}
            </h4>
            {user.location && (
              <p className="text-xs text-slate-500 truncate">{user.location}</p>
            )}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            Contratación protegida
          </span>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isFixedPrice && priceLabel
              ? `El precio publicado es ${priceLabel}. Solo cambia si ambos acuerdan un alcance distinto antes de formalizar el trabajo.`
              : contextTitle
                ? `Escríbele directamente a ${user.fullName} para explicarle lo que necesitas y confirmar los detalles.`
                : 'Escríbele directamente para explicar lo que necesitas y confirmar los detalles.'}
            {' '}La conversación queda dentro de BAXIO.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Link href={ROUTES.DIRECT_MESSAGES(user.id)} onClick={onClose}>
            <Button variant="primary" size="sm" leftIcon={<MessageCircle className="w-4 h-4" />}>
              Enviar mensaje
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
