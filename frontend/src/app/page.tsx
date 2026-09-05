'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Briefcase,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import { categoriesApi, servicesApi, jobRequestsApi, usersApi } from '@/services/api/endpoints';
import { Category, Service, JobRequest, User } from '@/types/common.types';
import { useUserMode } from '@/features/mode/context/ModeContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { CategoryCard } from '@/features/categories/components/CategoryCard';
import { ServiceCard } from '@/features/services/components/ServiceCard';
import { JobRequestCard } from '@/features/job-requests/components/JobRequestCard';
import { WorkerCard } from '@/features/workers/components/WorkerCard';
import { Button } from '@/components/ui/Button';
import { ModeSwitcher } from '@/components/layout/ModeSwitcher';
import { ROUTES } from '@/constants/routes';

export default function HomePage() {
  const { mode, isHiring, isWorking } = useUserMode();
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [jobRequests, setJobRequests] = useState<JobRequest[]>([]);
  const [workers, setWorkers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [cats, srvs, reqs, wrks] = await Promise.all([
          categoriesApi.getAll().catch(() => []),
          servicesApi.getAll().catch(() => []),
          jobRequestsApi.getAll().catch(() => []),
          usersApi.getWorkers().catch(() => []),
        ]);
        setCategories(cats);
        setServices(srvs);
        setJobRequests(reqs);
        setWorkers(wrks);
      } finally {
        setIsLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (isHiring) {
        router.push(`/explore?query=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/job-requests?query=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <div className="space-y-12 md:space-y-16 pb-12 dark:bg-slate-950">
      {/* 1. HERO SECTION (Dynamic based on Mode) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50 pt-8 pb-12 md:pt-14 md:pb-20 border-b border-slate-200/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:border-slate-800">
        <PageContainer>
          <div className="text-center max-w-3xl mx-auto space-y-4">
            {/* Mobile Mode Switcher (Visible on small screens) */}
            <div className="sm:hidden flex justify-center pb-2">
              <ModeSwitcher />
            </div>

            {/* Mode badge pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-brand-900 text-xs font-semibold shadow-subtle dark:bg-brand-950/70 dark:border-brand-800 dark:text-brand-100">
              {isHiring ? (
                <>
                  <Search className="w-3.5 h-3.5 text-brand-600" />
                  <span>Modo Contratar: Encuentra expertos verificados para tu hogar</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-600" />
                  <span>Modo Conseguir Chamba: Oportunidades y solicitudes abiertas</span>
                </>
              )}
            </div>

            {/* Main title */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] dark:text-slate-50">
              {isHiring ? (
                <>
                  Encuentra al profesional ideal o{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-sky-600">
                    publica lo que necesitas
                  </span>
                </>
              ) : (
                <>
                  Consigue nuevos clientes y{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                    gana más con tu oficio
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto dark:text-slate-300">
              {isHiring
                ? 'Explora cientos de técnicos y especialistas con precios claros y calificaciones reales de clientes.'
                : 'Postúlate a solicitudes abiertas de clientes en tu zona, envía tu cotización y haz crecer tu reputación.'}
            </p>

            {/* Hero Search Box */}
            <div className="pt-2 max-w-2xl mx-auto">
              <form
                onSubmit={handleHeroSearch}
                className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl md:rounded-full shadow-hover border border-slate-200 dark:bg-slate-900 dark:border-slate-700"
              >
                <div className="flex items-center gap-2.5 flex-1 px-4 w-full">
                  <Search className="w-5 h-5 text-brand-600 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isHiring
                        ? '¿Qué servicio buscas? ej. Plomero, Electricista, Pintor...'
                        : 'Buscar trabajos para postularte ej. Reparar minisplit, Instalar lámparas...'
                    }
                    className="w-full text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none py-2 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
                <Button
                  type="submit"
                  variant={isHiring ? 'primary' : 'work'}
                  size="md"
                  className="w-full sm:w-auto rounded-xl sm:rounded-full px-6 font-semibold"
                >
                  {isHiring ? 'Buscar Servicios' : 'Buscar Chamba'}
                </Button>
              </form>

              {/* Quick Tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {isHiring ? 'Categorías:' : 'Explora oportunidades por oficio:'}
                </span>
                {categories.slice(0, 5).map((cat) => (
                  <Link
                    key={cat.id}
                    href={isHiring ? `/explore?category=${cat.slug}` : `/job-requests?category=${cat.slug}`}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-300 hover:text-brand-600 transition-colors dark:bg-slate-900 dark:border-slate-700 dark:hover:border-brand-500"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust points */}
            <div className="pt-4 grid grid-cols-3 gap-2 max-w-xl mx-auto text-slate-600 text-xs font-medium dark:text-slate-300">
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Reputación Dual</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Cotizaciones Directas</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-600" />
                <span>Contratos Formales</span>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* 2. PRIORITIZED SECTION BASED ON ACTIVE MODE */}
      {isWorking ? (
        /* WORK MODE: Primary is Job Requests Board */
        <section>
          <PageContainer>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>Oportunidades Disponibles</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Solicitudes de Clientes Listas para Cotizar
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Clientes que buscan expertos ahora mismo. Envía tu presupuesto y gana el trabajo.
                </p>
              </div>
              <Link
                href={ROUTES.JOB_REQUESTS}
                className="text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 group"
              >
                <span>Ver todas las solicitudes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {jobRequests.slice(0, 4).map((request) => (
                <JobRequestCard key={request.id} jobRequest={request} />
              ))}
            </div>
          </PageContainer>
        </section>
      ) : (
        /* HIRE MODE: Primary is Featured Services */
        <section>
          <PageContainer>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider mb-1">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Marketplace de Servicios</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Servicios y Profesionales Destacados
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Contrata expertos calificados con precios claros y portafolio de trabajos
                </p>
              </div>
              <Link
                href={ROUTES.EXPLORE}
                className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
              >
                <span>Explorar marketplace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.slice(0, 6).map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {/* 3. CATEGORIES SECTION */}
      <section className="bg-slate-100/60 py-10 border-y border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
        <PageContainer>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Categorías Populares
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Explora los oficios más solicitados en la plataforma
              </p>
            </div>
            <Link
              href={ROUTES.EXPLORE}
              className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {categories.slice(0, 6).map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </PageContainer>
      </section>

      {/* 4. SECONDARY SECTION BASED ON MODE */}
      {isWorking ? (
        /* WORK MODE: Secondary shows Workers and creating a service */
        <section>
          <PageContainer>
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Comunidad de Profesionales
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Inspírate en perfiles con alta reputación en BAXIO
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.slice(0, 3).map((worker) => (
                <WorkerCard key={worker.id} worker={worker as any} />
              ))}
            </div>
          </PageContainer>
        </section>
      ) : (
        /* HIRE MODE: Secondary shows recent Job Requests board */
        <section>
          <PageContainer>
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-amber-600" />
                  <span>Tablero de Solicitudes</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  ¿Tienes un trabajo específico?
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Publica lo que necesitas y deja que los expertos te envíen cotizaciones
                </p>
              </div>
              <Link
                href={ROUTES.JOB_REQUESTS}
                className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 group"
              >
                <span>Ver solicitudes</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {jobRequests.slice(0, 4).map((request) => (
                <JobRequestCard key={request.id} jobRequest={request} />
              ))}
            </div>
          </PageContainer>
        </section>
      )}

      {/* 5. DUAL CALL TO ACTION */}
      <section>
        <PageContainer>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1: Contratar */}
            <div
              className={`p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl transition-all ${
                isHiring
                  ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white ring-2 ring-brand-500'
                  : 'bg-slate-900 text-white opacity-90'
              }`}
            >
              <div className="space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-2">
                  <Briefcase className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold">¿Necesitas ayuda con algún trabajo?</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Publica tu requerimiento en minutos. Especifica tu presupuesto aproximado y recibe propuestas de profesionales listos para trabajar.
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <Link href={ROUTES.NEW_JOB_REQUEST}>
                  <Button variant={isWorking ? 'work' : 'primary'} size="md" className="font-bold">
                    Publicar Solicitud de Trabajo
                  </Button>
                </Link>
              </div>
            </div>

            {/* Card 2: Ofrecer Servicios */}
            <div
              className={`p-8 rounded-3xl relative overflow-hidden flex flex-col justify-between shadow-xl transition-all ${
                isWorking
                  ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white ring-2 ring-amber-400'
                  : 'bg-gradient-to-br from-brand-700 to-brand-900 text-white'
              }`}
            >
              <div className="space-y-3 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center mb-2">
                  <Wrench className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-extrabold">¿Ofreces servicios profesionales?</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  Crea tu perfil en BAXIO, publica tus servicios con precios transparentes y postúlate a cientos de solicitudes de clientes en tu zona.
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <Link href={ROUTES.NEW_SERVICE}>
                  <Button
                    variant={isWorking ? 'work' : 'primary'}
                    size="md"
                    className="font-bold"
                  >
                    Publicar un Servicio
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </div>
  );
}
