'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Sparkles } from 'lucide-react';
import { servicesApi, categoriesApi } from '@/services/api/endpoints';
import { Category } from '@/types/common.types';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ImageUploader, PublicationImage } from '@/components/ui/ImageUploader';
import { ROUTES } from '@/constants/routes';

export default function NewServicePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [pricingType, setPricingType] = useState('FIXED');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [images, setImages] = useState<PublicationImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesApi.getAll().then((data) => {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    });
  }, []);

  useEffect(() => {
    const serviceId = new URLSearchParams(window.location.search).get('edit');
    if (!serviceId) return;
    setEditServiceId(serviceId);
    servicesApi.getById(serviceId).then((service) => {
      setTitle(service.title);
      setDescription(service.description);
      setCategoryId(service.category.id);
      setPricingType(service.pricingType);
      setPrice(service.price ? String(service.price) : '');
      setLocation(service.location);
      setServiceArea(service.serviceArea || '');
      setImages(service.images || []);
    }).catch(() => setError('No fue posible cargar el servicio para editarlo.'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImages) return;
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!title.trim() || !description.trim() || !categoryId || !location.trim()) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        pricingType,
        price: price ? Number(price) : undefined,
        location: location.trim(),
        serviceArea: serviceArea.trim() || undefined,
        images: images.map(({ imageUrl, isIllustrative }) => ({ imageUrl, isIllustrative })),
      };
      const newService = editServiceId
        ? await servicesApi.update(editServiceId, payload)
        : await servicesApi.create(payload);

      router.push(ROUTES.SERVICE_DETAIL(newService.id));
    } catch (err: any) {
      setError(err.message || 'Error al publicar el servicio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
          <Wrench className="w-3.5 h-3.5" />
          <span>Marketplace BAXIO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {editServiceId ? 'Editar Servicio Publicado' : 'Publicar un Nuevo Servicio'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {editServiceId ? 'Actualiza los detalles que verán tus clientes potenciales.' : 'Llega a cientos de clientes potenciales ofreciendo tu oficio o especialidad.'}
        </p>
      </div>

      <Card className="border-slate-200 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <Input
            label="Título del Servicio *"
            placeholder="ej. Instalación y Mantenimiento de Minisplits Inverter"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText="Un título claro que describa exactamente lo que ofreces."
            required
          />

          <Select
            label="Categoría *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Textarea
            label="Descripción Detallada *"
            placeholder="Describe tu experiencia, qué incluye tu servicio, marcas con las que trabajas, herramientas, garantías por escrito..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Modalidad de Cobro *"
              value={pricingType}
              onChange={(e) => setPricingType(e.target.value)}
              options={[
                { value: 'FIXED', label: 'Precio Fijo por Trabajo' },
                { value: 'STARTING_AT', label: 'Precio Desde (Aproximado)' },
                { value: 'HOURLY', label: 'Tarifa por Hora' },
                { value: 'CUSTOM_QUOTE', label: 'Cotización a Medida' },
              ]}
            />

            <Input
              label="Monto en Pesos ($ MXN)"
              type="number"
              placeholder="ej. 650"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={pricingType === 'CUSTOM_QUOTE'}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ubicación Base *"
              placeholder="ej. Monterrey, NL"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <Input
              label="Zona de Cobertura"
              placeholder="ej. San Pedro, Cumbres, Guadalupe"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
            />
          </div>

          <ImageUploader images={images} onChange={setImages} onBusyChange={setIsUploadingImages} disabled={isLoading || !isAuthenticated} />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              disabled={isUploadingImages}
              className="font-bold"
            >
              {editServiceId ? 'Guardar Cambios' : 'Publicar Servicio en BAXIO'}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
