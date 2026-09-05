import React from 'react';
import Link from 'next/link';
import { MapPin, Briefcase, Award } from 'lucide-react';
import { User } from '@/types/common.types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';

export const WorkerCard: React.FC<{ worker: User & { services?: any[] } }> = ({ worker }) => {
  return (
    <Link href={ROUTES.WORKER_PROFILE(worker.id)} className="block group">
      <Card hoverEffect className="p-5 flex flex-col justify-between h-full border-slate-200/80">
        <div>
          {/* Header */}
          <div className="flex items-start gap-3.5 mb-3.5">
            <Avatar
              src={worker.avatarUrl}
              name={worker.fullName}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                {worker.fullName}
              </h3>
              {worker.professionalHeadline && (
                <p className="text-[11px] font-semibold text-brand-700 truncate mt-0.5">
                  {worker.professionalHeadline}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2">
                <Rating
                  value={worker.workerRatingAvg}
                  count={worker.workerRatingCnt}
                  size="sm"
                />
              </div>
              {worker.location && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{worker.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {worker.bio && (
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
              {worker.bio}
            </p>
          )}

          {/* Experience & stats */}
          <div className="flex items-center justify-between gap-2 py-2 px-3 bg-slate-50 rounded-xl mb-3.5 text-xs text-slate-600 border border-slate-100">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{worker.experienceYears || 1}+ años exp.</span>
            </div>
            {worker.credentials && worker.credentials.length > 0 ? (
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <span>🛡️ {worker.credentials.length} certs. BAXIO ✓</span>
              </div>
            ) : worker.serviceArea ? (
              <div className="flex items-center gap-1.5 truncate">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{worker.serviceArea}</span>
              </div>
            ) : null}
          </div>

          {/* Active Services pills */}
          {worker.services && worker.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {worker.services.slice(0, 2).map((srv) => (
                <Badge key={srv.id} variant="brand" size="sm">
                  {srv.category?.name || srv.title}
                </Badge>
              ))}
              {worker.services.length > 2 && (
                <Badge variant="neutral" size="sm">
                  +{worker.services.length - 2} más
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Ver perfil & portafolio</span>
          <span className="font-bold text-brand-600 group-hover:translate-x-0.5 transition-transform">
            →
          </span>
        </div>
      </Card>
    </Link>
  );
};
