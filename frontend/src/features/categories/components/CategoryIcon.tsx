import React from 'react';
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
import styles from './CategoryIcon.module.css';

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

const customIcons = new Set([
  "minisplits-y-climas",
  "plomeria",
  "albanileria-y-construccion",
  "automotriz-y-gruas",
  "cerrajeria-y-herreria",
  "electrodomesticos-y-linea-blanca",
  "eventos-y-servicios-para-hogar",
  "jardineria-y-mantenimiento-exterior",
  "mudanzas-y-fletes",
  "pintura",
  "seguridad-camaras-y-alarmas",
  "computadoras"
]);

export function CategoryIcon({ category, className = 'w-7 h-7' }: {
  category: Pick<Category, 'slug' | 'iconName'>;
  className?: string;
}) {
  if (customIcons.has(category.slug)) {
    return <span aria-hidden="true" className={`${styles.icon} ${styles[category.slug]} ${className}`} />;
  }
  const Icon = (category.iconName && iconMap[category.iconName]) || Sparkles;
  return <Icon aria-hidden="true" className={className} />;
}
