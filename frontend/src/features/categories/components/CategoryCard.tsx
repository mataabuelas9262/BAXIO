import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Wrench,
  Wind,
  Paintbrush,
  Laptop,
  Hammer,
  KeyRound,
  HardHat,
  Umbrella,
  Flame,
  Trees,
  Truck,
  Refrigerator,
  ShieldCheck,
  Car,
  CalendarDays,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { Category } from '@/types/common.types';
import { Card } from '@/components/ui/Card';
import { useUserMode } from '@/features/mode/context/ModeContext';

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Wrench,
  Wind,
  Paintbrush,
  Laptop,
  Hammer,
  KeyRound,
  HardHat,
  Umbrella,
  Flame,
  Trees,
  Truck,
  Refrigerator,
  ShieldCheck,
  Car,
  CalendarDays,
};

export const CategoryCard: React.FC<{ category: Category }> = ({ category }) => {
  const IconComponent = (category.iconName && iconMap[category.iconName]) || Sparkles;
  const { isWorking } = useUserMode();

  const accent = isWorking
    ? {
        border: 'group-hover:border-amber-400/80',
        icon: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 dark:bg-amber-500/15 dark:text-amber-300 dark:group-hover:bg-amber-500',
        title: 'group-hover:text-amber-600 dark:group-hover:text-amber-300',
      }
    : {
        border: 'group-hover:border-brand-400/80',
        icon: 'bg-brand-50 text-brand-600 group-hover:bg-brand-600 dark:bg-brand-500/15 dark:text-brand-300 dark:group-hover:bg-brand-600',
        title: 'group-hover:text-brand-600 dark:group-hover:text-brand-300',
      };

  return (
    <Link href={`/explore?category=${category.slug}`} className="block group">
      <Card hoverEffect className={`p-4 flex flex-col items-center text-center ${accent.border} transition-all`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:text-white transition-all shadow-sm ${accent.icon}`}>
          <IconComponent className="w-6 h-6" />
        </div>
        <h3 className={`text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 transition-colors line-clamp-1 ${accent.title}`}>
          {category.name}
        </h3>
        {category._count && (
          <p className="text-[11px] text-slate-400 mt-0.5">
            {category._count.services || 0} servicios
          </p>
        )}
      </Card>
    </Link>
  );
};
