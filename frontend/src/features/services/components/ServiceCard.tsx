import React, { useState } from 'react';
import Link from 'next/link';
import { ImageOff, MapPin, ShieldCheck } from 'lucide-react';
import { Service } from '@/types/common.types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { ROUTES } from '@/constants/routes';
import { CategoryImagePlaceholder } from '@/features/categories/components/CategoryImagePlaceholder';

export const ServiceCard: React.FC<{ service: Service }> = ({ service }) => {
  const [hasImageError, setHasImageError] = useState(false);
  const coverImage = service.images?.[0]?.imageUrl;

  const formatPrice = () => {
    if (!service.price) return 'Cotización';
    const amount = Number(service.price).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    });

    switch (service.pricingType) {
      case 'STARTING_AT':
        return `Desde ${amount}`;
      case 'HOURLY':
        return `${amount} / hora`;
      case 'FIXED':
        return `${amount} fijo`;
      case 'CUSTOM_QUOTE':
      default:
        return 'Cotización a medida';
    }
  };

  return (
    <Link href={ROUTES.SERVICE_DETAIL(service.id)} className="block group">
      <Card hoverEffect className="p-0 overflow-hidden flex flex-col h-full border-slate-200/80">
        {/* Cover Image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          {!coverImage ? (
            <CategoryImagePlaceholder category={service.category} compact />
          ) : hasImageError ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-100 px-3 text-center text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <ImageOff className="h-5 w-5" />
              <span className="text-xs font-medium">Imagen no disponible</span>
            </div>
          ) : (
            <img
              src={coverImage}
              alt={service.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setHasImageError(true)}
            />
          )}
          {service.images?.[0]?.isIllustrative && <span className="absolute bottom-2 left-2 rounded bg-slate-900/90 px-2 py-1 text-xs text-white">Imagen ilustrativa</span>}
          <div className="absolute top-3 left-3">
            <Badge variant="brand" size="sm" className="shadow-sm font-semibold bg-white/95 backdrop-blur-sm">
              {service.category.name}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Provider info */}
            <div className="flex items-center gap-2.5 mb-2.5">
              <Avatar
                src={service.user.avatarUrl}
                name={service.user.fullName}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {service.user.fullName}
                  </span>
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                </div>
                <Rating
                  value={service.user.workerRatingAvg}
                  count={service.user.workerRatingCnt}
                  size="sm"
                />
              </div>
            </div>

            {/* Title & Description */}
            <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug mb-1">
              {service.title}
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
              {service.description}
            </p>
          </div>

          {/* Location and Price footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{service.location}</span>
              </div>
              {service.distanceKm !== undefined && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {service.distanceKm < 1 ? `A ${(service.distanceKm * 1000).toFixed(0)} m` : `A ${service.distanceKm} km`} de ti
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-extrabold text-brand-700 dark:text-sky-300">
                {formatPrice()}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
