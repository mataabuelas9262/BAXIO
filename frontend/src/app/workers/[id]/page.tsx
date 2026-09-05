'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  ShieldCheck,
  Award,
  Calendar,
  Star,
  Wrench,
  CheckCircle2,
  GraduationCap,
  Clock,
  Briefcase,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { usersApi } from '@/services/api/endpoints';
import { User, Service, Credential } from '@/types/common.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Button } from '@/components/ui/Button';
import { ServiceCard } from '@/features/services/components/ServiceCard';
import { CredentialBadge } from '@/components/ui/CredentialBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { DirectContactModal } from '@/features/services/components/DirectContactModal';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROUTES } from '@/constants/routes';

export default function WorkerProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllExperiences, setShowAllExperiences] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    async function loadWorker() {
      try {
        const data = await usersApi.getProfile(id);
        setProfile(data);
      } catch {
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }
    if (id) loadWorker();
  }, [id]);

  if (isLoading) {
    return <LoadingState message="Cargando perfil del profesional..." />;
  }

  if (!profile) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-slate-900">Perfil no encontrado</h2>
          <Link href={ROUTES.EXPLORE} className="mt-4 inline-block">
            <Button variant="primary">Volver al Marketplace</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const verifiedCredentials = profile.credentials?.filter(
    (c: Credential) => c.status === 'VERIFIED',
  ) || [];
  const declaredCredentials = profile.credentials?.filter(
    (c: Credential) => c.status === 'PENDING',
  ) || [];

  const visibleExperiences = showAllExperiences
    ? profile.experiences || []
    : (profile.experiences || []).slice(0, 2);

  return (
    <PageContainer>
      {/* Header Profile Card */}
      <Card className="p-6 md:p-8 border-slate-200 shadow-card mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <Avatar
              src={profile.avatarUrl}
              name={profile.fullName}
              size="xl"
              className="w-24 h-24 text-2xl shadow-md shrink-0"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {profile.fullName}
                </h1>
                {verifiedCredentials.length > 0 && (
                  <Badge variant="success" size="md" className="font-bold shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    {verifiedCredentials.length} Credenciales Verificadas ✓
                  </Badge>
                )}
              </div>

              {/* Professional Headline */}
              {profile.professionalHeadline && (
                <p className="text-sm font-bold text-brand-700">
                  {profile.professionalHeadline}
                </p>
              )}

              {/* Ratings */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-slate-600">Como Trabajador:</span>
                  <Rating
                    value={profile.workerRatingAvg}
                    count={profile.workerRatingCnt}
                    size="sm"
                  />
                </div>
                {Number(profile.clientRatingCnt) > 0 && (
                  <div className="flex items-center gap-1 text-slate-500">
                    <span className="font-semibold">Como Cliente:</span>
                    <Rating
                      value={profile.clientRatingAvg}
                      count={profile.clientRatingCnt}
                      size="sm"
                    />
                  </div>
                )}
              </div>

              {/* Location & Experience */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.serviceArea && (
                  <div className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Cobertura: {profile.serviceArea}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.experienceYears || 0} años de experiencia</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Action */}
          <div className="flex flex-col sm:flex-row md:flex-col items-center sm:items-end justify-center gap-3 shrink-0 w-full sm:w-auto mt-4 md:mt-0">
            {user?.id === profile.id ? (
              <span className="rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-800">Este es tu perfil profesional</span>
            ) : <Button variant="quote" size="md" className="w-full sm:w-auto font-bold" leftIcon={<MessageSquare className="w-4 h-4" />} onClick={() => setIsContactModalOpen(true)}>Solicitar cotización</Button>}
          </div>
        </div>

        {profile.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Acerca del Profesional
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed max-w-4xl">
              {profile.bio}
            </p>
          </div>
        )}
      </Card>

      {/* 2. SECTION: EXPERIENCIA PREVIA / TRAYECTORIA PROFESIONAL */}
      {profile.experiences && profile.experiences.length > 0 && (
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-brand-600" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Trayectoria y Experiencia Profesional ({profile.experiences.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleExperiences.map((exp: any) => (
              <Card key={exp.id} className="p-4 border-slate-200 bg-slate-50/60 space-y-1.5 hover:bg-white transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{exp.roleTitle}</h4>
                  {exp.isFreelance ? (
                    <Badge variant="brand" size="sm">
                      Profesional Independiente
                    </Badge>
                  ) : exp.companyName ? (
                    <span className="text-xs font-semibold text-slate-600">
                      • {exp.companyName}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {exp.startYear} – {exp.isCurrent ? 'Actualidad' : exp.endYear || exp.startYear}
                  </span>
                </div>

                {exp.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 pt-1 border-t border-slate-100">
                    {exp.description}
                  </p>
                )}
              </Card>
            ))}
          </div>

          {profile.experiences.length > 2 && (
            <div className="text-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-bold text-brand-700 hover:text-brand-800"
                onClick={() => setShowAllExperiences(!showAllExperiences)}
                rightIcon={showAllExperiences ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              >
                {showAllExperiences
                  ? 'Mostrar menos experiencias'
                  : `Ver ${profile.experiences.length - 2} experiencias más`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. SECTION: CREDENTIALS & CERTIFICATIONS */}
      {profile.credentials && profile.credentials.length > 0 && (
        <div className="space-y-4 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-brand-600" />
              <h2 className="text-xl font-extrabold text-slate-900">
                Credenciales y Certificaciones ({profile.credentials.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.credentials.map((cred: Credential) => (
              <CredentialBadge key={cred.id} credential={cred} />
            ))}
          </div>
        </div>
      )}

      {/* 3. SERVICES OFFERED */}
      <div className="space-y-6 mb-10">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-brand-600" />
          <h2 className="text-xl font-extrabold text-slate-900">
            Servicios Publicados ({profile.services?.length || 0})
          </h2>
        </div>

        {profile.services && profile.services.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.services.map((srv: Service) => (
              <ServiceCard
                key={srv.id}
                service={{
                  ...srv,
                  user: {
                    id: profile.id,
                    fullName: profile.fullName,
                    avatarUrl: profile.avatarUrl,
                    workerRatingAvg: profile.workerRatingAvg,
                    workerRatingCnt: profile.workerRatingCnt,
                    experienceYears: profile.experienceYears,
                  },
                }}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Este usuario aún no ha publicado servicios.</p>
        )}
      </div>

      {/* 4. PORTFOLIO ITEMS */}
      {profile.portfolioItems && profile.portfolioItems.length > 0 && (
        <div className="space-y-6 mb-10">
          <h2 className="text-xl font-extrabold text-slate-900">Portafolio de Trabajos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.portfolioItems.map((item: any) => (
              <Card key={item.id} className="p-0 overflow-hidden border-slate-200">
                <img src={item.imageUrl} alt={item.title} className="aspect-video object-cover w-full" />
                <div className="p-4">
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 5. REVIEWS RECEIVED */}
      {profile.receivedReviews && profile.receivedReviews.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-slate-900">Reseñas de Clientes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.receivedReviews.map((rev: any) => (
              <Card key={rev.id} className="p-5 border-slate-200">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar src={rev.author?.avatarUrl} name={rev.author?.fullName} size="sm" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{rev.author?.fullName}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.createdAt).toLocaleDateString('es-MX', {
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                  <Rating value={rev.rating} count={0} showCount={false} size="sm" />
                </div>
                {rev.comment ? (
                  <p className="text-xs text-slate-700 leading-relaxed italic">"{rev.comment}"</p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Calificación sin comentario escrito.</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Solicitud protegida: los datos de contacto se habilitan tras contratar. */}
      {user?.id !== profile.id && isContactModalOpen && (
        <DirectContactModal
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          user={profile}
        />
      )}
    </PageContainer>
  );
}
