'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, PlusCircle, Briefcase, MapPin, SlidersHorizontal } from 'lucide-react';
import { jobRequestsApi, categoriesApi } from '@/services/api/endpoints';
import { JobRequest, Category } from '@/types/common.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { JobRequestCard } from '@/features/job-requests/components/JobRequestCard';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROUTES } from '@/constants/routes';

export default function JobRequestsBoardPage() {
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Geolocalización y Proximidad
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => []);
  }, []);

  useEffect(() => {
    setSelectedCategory(new URLSearchParams(window.location.search).get('category') || '');
  }, []);

  const handleToggleNearMe = () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      setUserCoords(null);
      setMaxRadiusKm(undefined);
      return;
    }

    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsNearMeActive(true);
        setIsLocating(false);
      },
      () => {
        // En caso de denegación o error, usar coordenadas de referencia de la ciudad (Monterrey Centro)
        setUserCoords({
          lat: 25.6667,
          lng: -100.3167,
        });
        setIsNearMeActive(true);
        setIsLocating(false);
      },
      { timeout: 7000 },
    );
  };

  useEffect(() => {
    async function loadRequests() {
      setIsLoading(true);
      try {
        const res = await jobRequestsApi.getAll({
          query: searchQuery || undefined,
          categorySlug: selectedCategory || undefined,
          userLat: isNearMeActive ? userCoords?.lat : undefined,
          userLng: isNearMeActive ? userCoords?.lng : undefined,
          maxRadiusKm: isNearMeActive ? maxRadiusKm : undefined,
        });
        setJobRequests(res);
      } finally {
        setIsLoading(false);
      }
    }
    loadRequests();
  }, [searchQuery, selectedCategory, isNearMeActive, userCoords, maxRadiusKm]);

  return (
    <PageContainer>
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Oportunidades de Trabajo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Tablero de Solicitudes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Clientes publican lo que necesitan. Postula tu cotización y consigue nuevos clientes.
          </p>
        </div>

        <Link href={ROUTES.NEW_JOB_REQUEST} className="shrink-0">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
            Publicar una Solicitud
          </Button>
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="mb-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar solicitudes por oficio, problema o ubicación..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Botón Cerca de Mí */}
          <button
            onClick={handleToggleNearMe}
            disabled={isLocating}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shrink-0 cursor-pointer shadow-sm ${
              isNearMeActive
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 ring-2 ring-emerald-500/40'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <MapPin className={`w-4 h-4 ${isNearMeActive ? 'text-white' : 'text-emerald-600'}`} />
            <span>{isLocating ? 'Obteniendo GPS...' : isNearMeActive ? 'Cerca de Mí (Activo)' : 'Cerca de Mí'}</span>
          </button>
        </div>

        {/* Barra de Radio cuando Cerca de Mí está activo */}
        {isNearMeActive && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl animate-in fade-in slide-in-from-top-1">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Radio de búsqueda:
            </span>
            {[
              { label: '5 km', value: 5 },
              { label: '10 km', value: 10 },
              { label: '25 km', value: 25 },
              { label: 'Toda la ciudad', value: undefined },
            ].map((r) => (
              <button
                key={r.label}
                onClick={() => setMaxRadiusKm(r.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  maxRadiusKm === r.value
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                }`}
              >
                {r.label}
              </button>
            ))}
            <span className="text-[11px] text-emerald-700 font-medium ml-auto">
              ⚡ Ordenado de más cercano a más lejano
            </span>
          </div>
        )}

        {/* Category filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingState message="Cargando solicitudes de trabajo..." />
      ) : jobRequests.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {jobRequests.map((req) => (
            <JobRequestCard key={req.id} jobRequest={req} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No encontramos solicitudes abiertas"
          description="Sé el primero en publicar lo que necesitas para recibir cotizaciones."
          actionLabel="Publicar Solicitud de Trabajo"
          onAction={() => (window.location.href = ROUTES.NEW_JOB_REQUEST)}
        />
      )}
    </PageContainer>
  );
}
