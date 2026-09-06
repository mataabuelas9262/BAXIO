import { Category } from '@/types/common.types';
import { CategoryIcon } from './CategoryIcon';

export function CategoryImagePlaceholder({
  category,
  compact = false,
}: {
  category: Pick<Category, 'name' | 'slug' | 'iconName'>;
  compact?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 px-5 text-center">
      <div className={`${compact ? 'mb-2 h-12 w-12' : 'mb-4 h-20 w-20'} flex items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 ring-1 ring-brand-300/20`}>
        <CategoryIcon category={category} className={compact ? 'h-7 w-7' : 'h-11 w-11'} />
      </div>
      <p className={`${compact ? 'text-xs' : 'text-base'} font-bold text-white`}>{category.name}</p>
      <p className={`${compact ? 'mt-1 text-[11px]' : 'mt-2 text-sm'} text-slate-300`}>Sin fotografías del servicio</p>
    </div>
  );
}
