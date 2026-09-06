'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useNotice } from '@/components/ui/NoticeProvider';
import { useSearchParams } from 'next/navigation';
import { Search, Filter, Wrench, Briefcase, Users, MapPin, SlidersHorizontal } from 'lucide-react';
import { servicesApi, jobRequestsApi, categoriesApi, usersApi } from '@/services/api/endpoints';
import { Service, JobRequest, Category, User } from '@/types/common.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { ServiceCard } from '@/features/services/components/ServiceCard';
import { JobRequestCard } from '@/features/job-requests/components/JobRequestCard';
import { WorkerCard } from '@/features/workers/components/WorkerCard';
import { CategoryIcon } from '@/features/categories/components/CategoryIcon';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

function ExploreContent() {
  const showNotice = useNotice();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';
  const initialCategory = searchParams.get('category') || '';

  const [activeTab, setActiveTab] = useState<'services' | 'requests' | 'workers'>('services');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  useEffect(() => {
    setSearchQuery(initialQuery);
    setSelectedCategory(initialCategory);
    setActiveTab('services');
  }, [initialQuery, initialCategory]);

  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'price_asc' | 'price_desc' | 'distance'>('recent');

  // Estados de Geolocalización y Proximidad
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const debouncedQuery = useDebouncedValue(searchQuery.trim());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    categoriesApi.getAll().then(setCategories).catch(() => []);
  }, []);

  const handleToggleNearMe = () => {
    if (isNearMeActive) {
      setIsNearMeActive(false);
      setUserCoords(null);
      setMaxRadiusKm(undefined);
      if (sortBy === 'distance') setSortBy('recent');
      return;
    }

    if (!navigator.geolocation) {
      showNotice('Tu navegador no soporta geolocalización.');
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
        setSortBy('distance');
        setIsLocating(false);
      },
      () => {
        setUserCoords({
          lat: 25.6667,
          lng: -100.3167,
        });
        setIsNearMeActive(true);
        setSortBy('distance');
        setIsLocating(false);
      },
      { timeout: 7000 },
    );
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setIsLoading(true);
      try {
        if (activeTab === 'services') {
          const res = await servicesApi.getAll({
            query: debouncedQuery || undefined,
            categorySlug: selectedCategory || undefined,
            sortBy,
            userLat: isNearMeActive ? userCoords?.lat : undefined,
            userLng: isNearMeActive ? userCoords?.lng : undefined,
            maxRadiusKm: isNearMeActive ? maxRadiusKm : undefined,
          });
          if (!cancelled) setServices(res);
        } else if (activeTab === 'requests') {
          const res = await jobRequestsApi.getAll({
            query: debouncedQuery || undefined,
            categorySlug: selectedCategory || undefined,
            userLat: isNearMeActive ? userCoords?.lat : undefined,
            userLng: isNearMeActive ? userCoords?.lng : undefined,
            maxRadiusKm: isNearMeActive ? maxRadiusKm : undefined,
          });
          if (!cancelled) setJobRequests(res);
        } else {
          const res = await usersApi.getWorkers({
            query: debouncedQuery || undefined,
          });
          if (!cancelled) setWorkers(res);
        }
      } catch (error) {
        if (!cancelled) {
          setServices([]); setJobRequests([]); setWorkers([]);
          showNotice(error instanceof Error ? error.message : 'No se pudieron cargar los resultados.');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [activeTab, selectedCategory, debouncedQuery, sortBy, isNearMeActive, userCoords, maxRadiusKm]);

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explorar BAXIO
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Encuentra servicios profesionales, solicitudes abiertas de trabajo y expertos calificados.
        </p>
      </div>

      {/* Main Tabs (Servicios / Solicitudes / Trabajadores) */}
      <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-3 mb-6 sm:flex sm:items-center">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span className="sm:hidden">Servicios</span>
          <span className="hidden sm:inline">Servicios Publicados</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'requests'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span className="sm:hidden">Solicitudes</span>
          <span className="hidden sm:inline">Solicitudes de Trabajo</span>
        </button>

        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'workers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Profesionales</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-3.5 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, oficio, ubicación o descripción..."
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

          {activeTab === 'services' && (
            <div className="sm:w-52 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none cursor-pointer"
              >
                <option value="recent">Más recientes</option>
                <option value="distance">Más cercanos a mí</option>
                <option value="rating">Mejor calificados</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
              </select>
            </div>
          )}
        </div>

        {/* Radio de proximidad */}
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
      </div>

      {/* Category Pills Carousel */}
      {activeTab !== 'workers' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
              selectedCategory === ''
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Todas las categorías
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? '' : cat.slug)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat.slug
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
              }`}
            >
              <CategoryIcon category={cat} className="w-5 h-5" />
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Content Rendering */}
      {isLoading ? (
        <LoadingState message="Buscando resultados..." />
      ) : activeTab === 'services' ? (
        services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((srv) => (
              <ServiceCard key={srv.id} service={srv} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No encontramos servicios con esos criterios"
            description="Intenta cambiar los filtros de búsqueda o categoría para encontrar más opciones."
          />
        )
      ) : activeTab === 'requests' ? (
        jobRequests.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {jobRequests.map((req) => (
              <JobRequestCard key={req.id} jobRequest={req} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No hay solicitudes de trabajo abiertas"
            description="Sé el primero en publicar una solicitud de trabajo para recibir cotizaciones."
          />
        )
      ) : workers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {workers.map((w) => (
            <WorkerCard key={w.id} worker={w as any} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No encontramos profesionales con esa búsqueda"
          description="Intenta buscar con términos más generales como electricidad o plomería."
        />
      )}
    </PageContainer>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<LoadingState message="Cargando marketplace..." />}>
      <ExploreContent />
    </Suspense>
  );
}
