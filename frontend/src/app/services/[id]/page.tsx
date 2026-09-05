'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Phone,
  MessageSquare,
  Sparkles,
  Trash2,
  Pencil,
  ImageOff,
} from 'lucide-react';
import { servicesApi } from '@/services/api/endpoints';
import { Service } from '@/types/common.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { DirectContactModal } from '@/features/services/components/DirectContactModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ROUTES } from '@/constants/routes';

export default function ServiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedImageIndexes, setFailedImageIndexes] = useState<number[]>([]);

  useEffect(() => {
    async function loadService() {
      try {
        const data = await servicesApi.getById(id);
        setService(data);
      } catch {
        setService(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadService();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Cargando detalles del servicio..." />;
  }

  if (!service) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-slate-900">Servicio no encontrado</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            El servicio que buscas no existe o fue dado de baja.
          </p>
          <Link href={ROUTES.EXPLORE}>
            <Button variant="primary">Volver al Marketplace</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isOwnService = user?.id === service.user.id;
  const handleDelete = async () => {
    setIsDeleting(true);
    try { await servicesApi.delete(service.id); window.location.href = ROUTES.EXPLORE; }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };

  const images =
    service.images && service.images.length > 0
      ? service.images
      : [
          {
            id: 'default',
            imageUrl:
              'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1000&auto=format&fit=crop&q=80',
            order: 0,
          },
        ];

  const formatPrice = () => {
    if (!service.price) return 'Cotización personalizada';
    const amount = Number(service.price).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });

    switch (service.pricingType) {
      case 'STARTING_AT':
        return `Desde ${amount}`;
      case 'HOURLY':
        return `${amount} / hora`;
      case 'FIXED':
        return `${amount} por trabajo`;
      case 'CUSTOM_QUOTE':
      default:
        return 'Cotización a convenir';
    }
  };

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href={ROUTES.HOME} className="hover:text-slate-900">
          Inicio
        </Link>
        <span>/</span>
        <Link href={ROUTES.EXPLORE} className="hover:text-slate-900">
          Servicios
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{service.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Gallery & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Gallery */}
          <Card className="p-0 overflow-hidden border-slate-200">
            <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
              {failedImageIndexes.includes(activeImageIndex) ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <ImageOff className="h-7 w-7" />
                  <span className="text-sm font-medium">Imagen no disponible</span>
                </div>
              ) : (
                <img
                  src={images[activeImageIndex].imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  onError={() => setFailedImageIndexes((indexes) => Array.from(new Set([...indexes, activeImageIndex])))}
                />
              )}
              <div className="absolute top-4 left-4">
                <Badge variant="brand" size="md" className="shadow-md bg-white/95 font-bold">
                  {service.category.name}
                </Badge>
              </div>
            </div>

            {images.length > 1 && (
              <div className="p-3 bg-slate-50 flex gap-2 overflow-x-auto border-t border-slate-100">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      activeImageIndex === idx ? 'border-brand-600 scale-105' : 'border-transparent opacity-70'
                    }`}
                  >
                      {failedImageIndexes.includes(idx) ? (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800">
                          <ImageOff className="h-4 w-4" />
                        </div>
                      ) : (
                        <img
                          src={img.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={() => setFailedImageIndexes((indexes) => Array.from(new Set([...indexes, idx])))}
                        />
                      )}
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Title & Description Card */}
          <Card className="space-y-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              {service.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{service.location}</span>
              </div>
              {service.serviceArea && (
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Cobertura: {service.serviceArea}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  Publicado{' '}
                  {new Date(service.createdAt).toLocaleDateString('es-MX', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Descripción del Servicio</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>
          </Card>

          {/* Portfolio items */}
          {service.portfolioItems && service.portfolioItems.length > 0 && (
            <Card className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">Trabajos Realizados (Portafolio)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.portfolioItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col"
                  >
                    <img src={item.imageUrl} alt={item.title} className="aspect-video object-cover" />
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                      {item.description && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Pricing & Provider Bio */}
        <div className="space-y-6">
          {/* Pricing & CTA Card */}
          <Card className="sticky top-20 border-slate-200 shadow-hover">
            <div className="mb-4 pb-4 border-b border-slate-100">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                Precio estimado
              </span>
              <p className="text-2xl font-black text-brand-700 dark:text-sky-300 mt-1">{formatPrice()}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Trato directo sin comisiones ocultas al cliente.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Reputación y reseñas verificadas.</span>
              </div>
            </div>

            {isOwnService ? (
              <div className="space-y-2"><div className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-3 text-center text-xs font-semibold text-brand-800">Este es tu servicio publicado</div><Link href={`/services/new?edit=${service.id}`}><Button variant="outline" size="sm" className="w-full" leftIcon={<Pencil className="w-4 h-4" />}>Editar servicio</Button></Link><Button variant="outline" size="sm" className="w-full text-rose-700 border-rose-200 hover:bg-rose-50" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Eliminar servicio</Button></div>
            ) : (
              <Button variant="quote" size="lg" className="w-full font-bold" leftIcon={<MessageSquare className="w-5 h-5" />} onClick={() => setIsContactModalOpen(true)}>
                Solicitar cotización
              </Button>
            )}
          </Card>

          {/* Provider Card */}
          <Card className="border-slate-200">
            <div className="flex items-start gap-3.5 mb-4">
              <Avatar
                src={service.user.avatarUrl}
                name={service.user.fullName}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">
                  {service.user.fullName}
                </h3>
                <div className="mt-1">
                  <Rating
                    value={service.user.workerRatingAvg}
                    count={service.user.workerRatingCnt}
                    size="sm"
                  />
                </div>
                {service.user.location && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{service.user.location}</span>
                  </div>
                )}
              </div>
            </div>

            {service.user.bio && (
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                {service.user.bio}
              </p>
            )}

            <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600 mb-4 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{service.user.experienceYears || 0} años de experiencia</span>
              </div>
            </div>

            <Link href={ROUTES.WORKER_PROFILE(service.user.id)}>
              <Button variant="outline" size="sm" className="w-full">
                Ver Perfil Completo y Reseñas
              </Button>
            </Link>
          </Card>
        </div>
      </div>

      {/* Solicitud protegida: los datos de contacto se habilitan tras contratar. */}
      {!isOwnService && isContactModalOpen && (
        <DirectContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          user={service.user}
          contextTitle={service.title}
        />
      )}
      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} title="¿Eliminar este servicio?" description="Se retirará del marketplace y esta acción no se puede deshacer." confirmLabel="Sí, eliminar servicio" variant="danger" isConfirming={isDeleting} />
    </PageContainer>
  );
}
