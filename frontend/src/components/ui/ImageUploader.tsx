'use client';
import { useId, useState } from 'react';
import { uploadsApi } from '@/services/api/endpoints';

export type PublicationImage = { imageUrl: string; isIllustrative?: boolean };
export function ImageUploader({ images, onChange, onBusyChange, disabled = false }: {
  images: PublicationImage[]; onChange: (images: PublicationImage[]) => void;
  onBusyChange: (busy: boolean) => void; disabled?: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function upload(files: File[]) {
    setError('');
    if (files.length + images.length > 6) { setError('Puedes añadir hasta 6 imágenes.'); return; }
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Selecciona imágenes JPG, PNG o WebP de hasta 5 MB cada una.'); return;
    }
    setBusy(true); onBusyChange(true);
    const next = [...images];
    try {
      for (const file of files) {
        const result = await uploadsApi.uploadImage(file);
        next.push({ imageUrl: result.url, isIllustrative: false });
        onChange([...next]);
      }
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo subir la imagen. Inténtalo de nuevo.'); }
    finally { setBusy(false); onBusyChange(false); }
  }
  return <fieldset disabled={disabled || busy} className="space-y-3 min-w-0">
    <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">Fotografías</legend>
    <p id={`${id}-help`} className="text-xs text-slate-500 dark:text-slate-400">Hasta 6 fotos JPG, PNG o WebP de 5 MB. Usa fotos de tu trabajo; marca las imágenes creadas con IA o de referencia como ilustrativas.</p>
    <label htmlFor={id} className="block text-sm font-medium text-brand-700 dark:text-brand-300">Añadir fotografías</label>
    <input id={id} aria-describedby={`${id}-help`} type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={disabled || busy || images.length >= 6}
      className="block w-full text-xs text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-700"
      onChange={event => { const files = Array.from(event.target.files || []); event.target.value = ''; if (files.length) void upload(files); }} />
    {busy && <p role="status" className="text-sm text-brand-600">Subiendo fotografías…</p>}
    {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-300">{error}</p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {images.map((image, index) => <div key={`${image.imageUrl}-${index}`} className="rounded-xl border border-slate-200 p-2 dark:border-slate-700">
        <img src={image.imageUrl} alt={`Fotografía ${index + 1}`} className="aspect-video w-full rounded-lg object-cover" />
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={Boolean(image.isIllustrative)} onChange={event => onChange(images.map((item, i) => i === index ? { ...item, isIllustrative: event.target.checked } : item))} />
          Imagen ilustrativa (IA o referencia)
        </label>
        <button type="button" className="mt-2 rounded px-2 py-1 text-xs font-semibold text-rose-600 dark:text-rose-300" onClick={() => onChange(images.filter((_, i) => i !== index))}>Eliminar fotografía {index + 1}</button>
      </div>)}
    </div>
  </fieldset>;
}
