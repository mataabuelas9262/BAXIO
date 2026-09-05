import React from 'react';
import { ShieldCheck, Clock, Award, GraduationCap, FileCheck2, AlertCircle } from 'lucide-react';
import { Credential, CredentialType, CredentialStatus } from '@/types/common.types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface CredentialBadgeProps {
  credential: Credential;
  showDetails?: boolean;
  onDelete?: (id: string) => void;
  className?: string;
}

export const CredentialBadge: React.FC<CredentialBadgeProps> = ({
  credential,
  showDetails = true,
  onDelete,
  className,
}) => {
  const isVerified = credential.status === 'VERIFIED';
  const isPending = credential.status === 'PENDING';

  const typeIcon = {
    CERTIFICATION: Award,
    DIPLOMA: FileCheck2,
    DEGREE: GraduationCap,
    LICENSE: ShieldCheck,
    COURSE: Award,
  }[credential.type] || Award;

  const TypeIcon = typeIcon;

  return (
    <div
      className={cn(
        'p-4 rounded-2xl border transition-all',
        isVerified
          ? 'bg-emerald-50/50 border-emerald-200/80 shadow-subtle dark:bg-emerald-950/40 dark:border-emerald-700/80'
          : isPending
          ? 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
          : 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'p-2.5 rounded-xl shrink-0 mt-0.5',
              isVerified
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                : isPending
                ? 'bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
            )}
          >
            <TypeIcon className="w-5 h-5" />
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight dark:text-slate-100">
              {credential.title}
            </h4>
            <p className="text-xs text-slate-600 font-medium mt-0.5 dark:text-slate-300">
              {credential.issuer}
            </p>

            {showDetails && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-2 dark:text-slate-400">
                {credential.credentialId && (
                  <span>
                    Folio/Cédula: <strong className="text-slate-700 dark:text-slate-200">{credential.credentialId}</strong>
                  </span>
                )}
                {credential.issueDate && (
                  <span>
                    Emitido: {new Date(credential.issueDate).getFullYear()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verification Status Pill */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {isVerified ? (
            <Badge variant="success" size="sm" className="font-bold flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verificado por BAXIO ✓</span>
            </Badge>
          ) : isPending ? (
            <Badge variant="warning" size="sm" className="font-semibold flex items-center gap-1 text-[10px]">
              <Clock className="w-3 h-3" />
              <span>Declarado por profesional (En revisión)</span>
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              No Aprobado
            </Badge>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(credential.id)}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors pt-1"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
