import React from 'react';
import Link from 'next/link';
import { MapPin, DollarSign, Users, Calendar } from 'lucide-react';
import { JobRequest } from '@/types/common.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { ROUTES } from '@/constants/routes';

export const JobRequestCard: React.FC<{ jobRequest: JobRequest }> = ({ jobRequest }) => {
  const formatBudget = () => {
    if (!jobRequest.budgetMin && !jobRequest.budgetMax) return 'A convenir';
    const min = jobRequest.budgetMin ? `$${Number(jobRequest.budgetMin).toLocaleString('es-MX')}` : '';
    const max = jobRequest.budgetMax ? `$${Number(jobRequest.budgetMax).toLocaleString('es-MX')}` : '';

    if (min && max) return `${min} - ${max} MXN`;
    if (min) return `Desde ${min} MXN`;
    return `Hasta ${max} MXN`;
  };

  const statusVariant = {
    OPEN: 'success' as const,
    IN_SELECTION: 'warning' as const,
    ASSIGNED: 'purple' as const,
    CANCELLED: 'danger' as const,
  };

  const statusLabel = {
    OPEN: 'Abierto para propuestas',
    IN_SELECTION: 'En selección',
    ASSIGNED: 'Asignado',
    CANCELLED: 'Cancelado',
  };

  return (
    <Link href={ROUTES.JOB_REQUEST_DETAIL(jobRequest.id)} className="block group">
      <Card hoverEffect className="p-5 flex flex-col justify-between h-full border-slate-200/80">
        <div>
          {/* Header with category and status */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <Badge variant="brand" size="sm" className="font-semibold">
              {jobRequest.category.name}
            </Badge>
            <Badge variant={statusVariant[jobRequest.status]} size="sm">
              {statusLabel[jobRequest.status]}
            </Badge>
          </div>

          {/* Title and Description */}
          <h3 className="text-base font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug mb-2">
            {jobRequest.title}
          </h3>

          {/* Proximity Distance Badge */}
          {jobRequest.distanceKm !== undefined && (
            <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold mb-2.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>
                {jobRequest.distanceKm < 1
                  ? `A ${(jobRequest.distanceKm * 1000).toFixed(0)} m de ti`
                  : `A ${jobRequest.distanceKm} km de ti`}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
            {jobRequest.description}
          </p>

          {/* Key details */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
            <div className="flex items-center gap-1.5 truncate">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-slate-900 truncate">{formatBudget()}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{jobRequest.location}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Users className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                {jobRequest._count?.proposals || jobRequest.proposals?.length || 0} propuestas
              </span>
            </div>
            {jobRequest.requiredDate && (
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">
                  {new Date(jobRequest.requiredDate).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Creator */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar
              src={jobRequest.user.avatarUrl}
              name={jobRequest.user.fullName}
              size="sm"
            />
            <div>
              <p className="text-xs font-semibold text-slate-800">{jobRequest.user.fullName}</p>
              <p className="text-[10px] text-slate-400">Cliente BAXIO</p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">
            Ver detalles →
          </span>
        </div>
      </Card>
    </Link>
  );
};
