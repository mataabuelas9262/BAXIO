'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, MapPin, ShieldCheck, Lock } from 'lucide-react';
import { jobRequestsApi, categoriesApi } from '@/services/api/endpoints';
import { Category } from '@/types/common.types';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export default function NewJobRequestPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const isEditing = Boolean(editRequestId);

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [exactAddress, setExactAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [geoNotice, setGeoNotice] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [requiredDate, setRequiredDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setEditRequestId(new URLSearchParams(window.location.search).get('edit'));
  }, []);

  useEffect(() => {
    categoriesApi.getAll().then((data) => {
      setCategories(data);
      if (data.length > 0 && !editRequestId) setCategoryId(data[0].id);
    });
  }, [editRequestId]);

  useEffect(() => {
    if (!editRequestId || !isAuthenticated) return;

    jobRequestsApi.getForEditing(editRequestId)
      .then((request) => {
        setTitle(request.title);
        setDescription(request.description);
        setCategoryId(request.categoryId);
        setLocation(request.location);
        setExactAddress(request.exactAddress || '');
        setBudgetMin(request.budgetMin?.toString() || '');
        setBudgetMax(request.budgetMax?.toString() || '');
        setRequiredDate(request.requiredDate ? request.requiredDate.slice(0, 10) : '');
        setCoords(
          request.latitude !== null && request.latitude !== undefined &&
          request.longitude !== null && request.longitude !== undefined
            ? { lat: Number(request.latitude), lng: Number(request.longitude) }
            : null,
        );
        const urls = request.images?.map((image) => image.imageUrl) || [];
        setExistingImageUrls(urls);
        setImageUrl(urls[0] || '');
      })
      .catch((err: Error) => setError(err.message || 'No se pudo cargar la solicitud para editar'));
  }, [editRequestId, isAuthenticated]);

  const handleDetectGeo = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setIsDetectingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGeoNotice('Coordenadas de proximidad asignadas.');
        setIsDetectingGeo(false);
      },
      () => {
        setIsDetectingGeo(false);
        alert('No se pudo obtener la ubicación.');
      },
      { timeout: 8000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }

    if (!title.trim() || !description.trim() || !categoryId || !location.trim()) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const imageUrls = imageUrl.trim()
        ? [imageUrl.trim(), ...existingImageUrls.slice(1)]
        : [];
      const requestData = {
        title: title.trim(),
        description: description.trim(),
        categoryId,
        location: location.trim(),
        exactAddress: exactAddress.trim() || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        requiredDate: requiredDate || undefined,
        imageUrls,
      };
      const newRequest = isEditing && editRequestId
        ? await jobRequestsApi.update(editRequestId, requestData)
        : await jobRequestsApi.create(requestData);

      router.push(ROUTES.JOB_REQUEST_DETAIL(newRequest.id));
    } catch (err: any) {
      setError(err.message || 'Error al publicar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="sm">
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Tablero de Solicitudes BAXIO</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Editar Solicitud de Trabajo' : 'Publicar una Solicitud de Trabajo'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isEditing
            ? 'Actualiza los detalles antes de formalizar una contratación.'
            : 'Describe lo que necesitas solucionar y recibe ofertas de trabajadores disponibles.'}
        </p>
      </div>

      <Card className="border-slate-200 shadow-card">
        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              {error}
            </div>
          )}

          <Input
            label="¿Qué necesitas hacer? (Título) *"
            placeholder="ej. Necesito pintar sala y recámara principal este sábado"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            helperText="Un título conciso y directo para que los profesionales lo entiendan rápido."
            required
          />

          <Select
            label="Categoría del Trabajo *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />

          <Textarea
            label="Descripción del Requerimiento *"
            placeholder="Explica qué problema tienes, medidas aproximadas, si ya cuentas con el material o requieres que el trabajador lo cotice, urgencia..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Presupuesto Mínimo ($ MXN)"
              type="number"
              placeholder="ej. 1000"
              min={0}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
            />
            <Input
              label="Presupuesto Máximo ($ MXN)"
              type="number"
              placeholder="ej. 2000"
              min={0}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>

          {/* Sección de Ubicación y Privacidad */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-600" />
                  <span>Ubicación y Privacidad de tu Domicilio</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  La zona aproximada es pública. Tu dirección exacta se mantiene confidencial.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 text-xs font-bold"
                leftIcon={<MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={handleDetectGeo}
                isLoading={isDetectingGeo}
              >
                Asignar Coordenadas (GPS)
              </Button>
            </div>

            {geoNotice && (
              <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                {geoNotice}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Zona / Colonia o Municipio (Público) *"
                placeholder="ej. San Pedro Garza García • Valle Oriente"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                helperText="Visible para que los técnicos calculen si están dentro de su cobertura."
                required
              />
              <Input
                label="Fecha Requerida (Opcional)"
                type="date"
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Input
                label="Dirección Exacta y Referencias (Privada y Protegida)"
                placeholder="ej. Av. Vasconcelos #310 Int. 204, portón negro frente al parque"
                value={exactAddress}
                onChange={(e) => setExactAddress(e.target.value)}
              />
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/60 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>Privacidad BAXIO:</strong> Esta dirección NUNCA aparecerá en el tablero público. Solo se revelará al profesional que contrates formalmente.
                </span>
              </div>
            </div>
          </div>

          <Input
            label="Fotografía del Problema o Área (URL de imagen)"
            placeholder="https://ejemplo.com/foto-fuga.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            helperText="Ayuda a los profesionales a darte una cotización más exacta."
          />

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
              className="font-bold"
            >
              {isEditing ? 'Guardar Cambios' : 'Publicar Solicitud'}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
