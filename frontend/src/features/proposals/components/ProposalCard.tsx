import React from 'react';
import { CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { Proposal } from '@/types/common.types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';

export interface ProposalCardProps {
  proposal: Proposal;
  isJobOwner: boolean;
  onAccept?: (proposalId: string) => void;
  isAccepting?: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  isJobOwner,
  onAccept,
  isAccepting = false,
}) => {
  const statusBadge = {
    PENDING: { label: 'Pendiente', variant: 'warning' as const },
    ACCEPTED: { label: '¡Propuesta Aceptada!', variant: 'success' as const },
    REJECTED: { label: 'Rechazada', variant: 'neutral' as const },
    CANCELLED: { label: 'Cancelada', variant: 'danger' as const },
  };

  const currentStatus = statusBadge[proposal.status];

  return (
    <Card className="p-5 border-slate-200/80 mb-3">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <Avatar
            src={proposal.worker.avatarUrl}
            name={proposal.worker.fullName}
            size="md"
          />
          <div>
            <h4 className="text-sm font-bold text-slate-900">{proposal.worker.fullName}</h4>
            {proposal.worker.professionalHeadline && (
              <p className="text-xs font-semibold text-brand-700">
                {proposal.worker.professionalHeadline}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-0.5">
              <Rating
                value={proposal.worker.workerRatingAvg}
                count={proposal.worker.workerRatingCnt}
                size="sm"
              />
              {proposal.worker.experienceYears ? (
                <span className="text-xs text-slate-400">
                  • {proposal.worker.experienceYears} años exp.
                </span>
              ) : null}
              {proposal.worker.credentials && proposal.worker.credentials.length > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  🛡️ {proposal.worker.credentials.length} certs. verificadas
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-1">
          <div className="flex items-center text-base font-extrabold text-brand-700 dark:text-sky-300">
            <DollarSign className="w-4 h-4 text-brand-500" />
            <span>${Number(proposal.price).toLocaleString('es-MX')} MXN</span>
          </div>
          <Badge variant={currentStatus.variant} size="sm">
            {currentStatus.label}
          </Badge>
        </div>
      </div>

      <div className="py-3.5">
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {proposal.message}
        </p>

        {proposal.estimatedDays && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Tiempo estimado de entrega: {proposal.estimatedDays} día(s)</span>
          </div>
        )}
      </div>

      {isJobOwner && proposal.status === 'PENDING' && onAccept && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isAccepting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            onClick={() => onAccept(proposal.id)}
          >
            Aceptar Propuesta y Contratar
          </Button>
        </div>
      )}
    </Card>
  );
};
