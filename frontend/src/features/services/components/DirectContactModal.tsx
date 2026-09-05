'use client';

import React from 'react';
import Link from 'next/link';
import { FilePlus2, Info, ShieldCheck } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

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
}

export function DirectContactModal({
  isOpen,
  onClose,
  user,
  contextTitle,
}: DirectContactModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Solicitar cotización a ${user.fullName}`}
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
            {contextTitle ? `Publica lo que necesitas para recibir una propuesta de ${user.fullName} y de otros profesionales verificados.` : 'Publica lo que necesitas para recibir propuestas de profesionales verificados.'}
            {' '}Los datos de contacto se habilitan cuando se formaliza una orden de trabajo.
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
          <Link href={ROUTES.NEW_JOB_REQUEST}>
            <Button variant="primary" size="sm" leftIcon={<FilePlus2 className="w-4 h-4" />}>
              Publicar solicitud
            </Button>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
