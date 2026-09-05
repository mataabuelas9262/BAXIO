'use client';

import React, { useEffect, useState } from 'react';
import { useNotice } from '@/components/ui/NoticeProvider';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  DollarSign,
  Calendar,
  Send,
  CheckCircle2,
  Users,
  Briefcase,
  AlertCircle,
  ImageOff,
  Trash2,
  Pencil,
} from 'lucide-react';
import { jobRequestsApi, proposalsApi } from '@/services/api/endpoints';
import { JobRequest } from '@/types/common.types';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { ProposalModal } from '@/features/proposals/components/ProposalModal';
import { ProposalCard } from '@/features/proposals/components/ProposalCard';
import { ROUTES } from '@/constants/routes';

function JobRequestImage({ src }: { src: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="aspect-video rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-1.5 px-3 text-center text-slate-500">
        <ImageOff className="w-5 h-5 text-slate-400" />
        <span className="text-xs font-medium">Imagen no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="Detalle de solicitud"
      className="rounded-xl border border-slate-200 aspect-video object-cover"
      onError={() => setHasError(true)}
    />
  );
}

export default function JobRequestDetailPage() {
  const showNotice = useNotice();
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  const [jobRequest, setJobRequest] = useState<JobRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isAcceptingId, setIsAcceptingId] = useState<string | null>(null);
  const [proposalToAccept, setProposalToAccept] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadJobRequest = async () => {
    try {
      const data = await jobRequestsApi.getById(id);
      setJobRequest(data);
    } catch {
      setJobRequest(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadJobRequest();
  }, [id]);

  const handleAcceptProposal = async (proposalId: string) => {
    setIsAcceptingId(proposalId);
    try {
      const res = await proposalsApi.acceptProposal(proposalId);
      setActionSuccessMessage(
        '¡Propuesta aceptada con éxito! Se ha creado la orden de trabajo para iniciar la chamba.',
      );
      await loadJobRequest();
    } catch (err: any) {
      showNotice(err.message || 'Error al aceptar la propuesta');
    } finally {
      setIsAcceptingId(null);
      setProposalToAccept(null);
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando detalles de la solicitud..." />;
  }

  if (!jobRequest) {
    return (
      <PageContainer>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-slate-900">Solicitud no encontrada</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            La solicitud de trabajo que buscas no existe o fue retirada.
          </p>
          <Link href={ROUTES.JOB_REQUESTS}>
            <Button variant="primary">Ver Tablero de Solicitudes</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const isOwner = user?.id === jobRequest.userId;
  const canDelete = isOwner && jobRequest.status === 'OPEN' && !jobRequest.proposals?.some((proposal) => proposal.status === 'ACCEPTED');
  const canEdit = canDelete && !jobRequest.workOrder;
  const handleDelete = async () => {
    setIsDeleting(true);
    try { await jobRequestsApi.delete(jobRequest.id); router.push(ROUTES.JOB_REQUESTS); }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); }
  };
  const hasUserSubmittedProposal = jobRequest.proposals?.some((p) => p.workerId === user?.id);

  const formatBudget = () => {
    if (!jobRequest.budgetMin && !jobRequest.budgetMax) return 'A convenir con el profesional';
    const min = jobRequest.budgetMin ? `$${Number(jobRequest.budgetMin).toLocaleString('es-MX')}` : '';
    const max = jobRequest.budgetMax ? `$${Number(jobRequest.budgetMax).toLocaleString('es-MX')}` : '';

    if (min && max) return `${min} - ${max} MXN`;
    if (min) return `Desde ${min} MXN`;
    return `Hasta ${max} MXN`;
  };

  const statusVariant = {
    OPEN: 'success' as const,
    IN_SELECTION: 'warning' as const,
    ASSIGNED: 'purple' as const,
    CANCELLED: 'danger' as const,
  };

  const statusLabel = {
    OPEN: 'Abierto para recibir propuestas',
    IN_SELECTION: 'En selección',
    ASSIGNED: 'Asignado a un profesional',
    CANCELLED: 'Cancelado',
  };

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href={ROUTES.HOME} className="hover:text-slate-900">
          Inicio
        </Link>
        <span>/</span>
        <Link href={ROUTES.JOB_REQUESTS} className="hover:text-slate-900">
          Solicitudes
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{jobRequest.title}</span>
      </div>

      {actionSuccessMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Request Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <Badge variant="brand" size="md" className="font-bold">
                {jobRequest.category.name}
              </Badge>
              <Badge variant={statusVariant[jobRequest.status]} size="md">
                {statusLabel[jobRequest.status]}
              </Badge>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              {jobRequest.title}
            </h1>

            <div className="flex flex-wrap gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600">
              <div className="flex flex-1 min-w-[11rem] items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Presupuesto</p>
                  <p className="font-bold text-slate-900">{formatBudget()}</p>
                </div>
              </div>

              <div className="flex flex-1 min-w-[11rem] items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Ubicación</p>
                  <p className="font-bold text-slate-900 truncate">{jobRequest.location}</p>
                </div>
              </div>

              <div className="flex flex-1 min-w-[11rem] items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Fecha estimada</p>
                  <p className="font-bold text-slate-900">
                    {jobRequest.requiredDate
                      ? new Date(jobRequest.requiredDate).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Lo antes posible'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Detalles del Trabajo</h3>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {jobRequest.description}
              </p>
            </div>

            {/* Images attached */}
            {jobRequest.images && jobRequest.images.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-700 mb-3">Imágenes adjuntas</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {jobRequest.images.map((img) => (
                    <div key={img.id} className="relative"><JobRequestImage src={img.imageUrl} />{img.isIllustrative && <span className="absolute bottom-2 left-2 rounded bg-slate-900/90 px-2 py-1 text-xs text-white">Imagen ilustrativa</span>}</div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Section: Proposals Received */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Propuestas Recibidas ({jobRequest.proposals?.length || 0})
                </h3>
              </div>
            </div>

            {jobRequest.proposals && jobRequest.proposals.length > 0 ? (
              <div>
                {jobRequest.proposals.map((prop) => (
                  <ProposalCard
                    key={prop.id}
                    proposal={prop}
                    isJobOwner={isOwner}
                    onAccept={setProposalToAccept}
                    isAccepting={isAcceptingId === prop.id}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-slate-300">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">Aún no hay propuestas enviadas</p>
                <p className="text-xs text-slate-500 mt-1">
                  Sé el primer profesional en enviar una cotización a este cliente.
                </p>
              </Card>
            )}
          </div>
        </div>

        {/* Right column: Action Banner & Client Profile */}
        <div className="space-y-6">
          {/* Action Box */}
          <Card className="border-slate-200 shadow-hover sticky top-20">
            {jobRequest.status === 'OPEN' ? (
              !isOwner ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900">¿Haces este trabajo?</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Envía tu presupuesto y fecha de entrega al cliente.
                    </p>
                  </div>

                  {hasUserSubmittedProposal ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Ya has enviado una propuesta a esta solicitud. Revisa tu estado abajo.</span>
                    </div>
                  ) : (
                    <Button
                      variant="quote"
                      size="lg"
                      className="w-full font-bold"
                      leftIcon={<Send className="w-4 h-4" />}
                      onClick={() => {
                        if (!isAuthenticated) {
                          router.push(ROUTES.LOGIN);
                          return;
                        }
                        setIsProposalModalOpen(true);
                      }}
                    >
                      Enviar Propuesta / Cotización
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-900 text-xs space-y-2">
                    <p className="font-bold text-sm">Eres el creador de esta solicitud</p>
                    <p className="text-brand-700">
                      Revisa las cotizaciones que te envíen los trabajadores en la lista de propuestas y pulsa "Aceptar Propuesta" en el candidato que prefieras.
                    </p>
                  </div>
                  {canEdit && (
                    <Link href={`${ROUTES.NEW_JOB_REQUEST}?edit=${jobRequest.id}`}>
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Pencil className="w-4 h-4" />}>
                        Editar solicitud
                      </Button>
                    </Link>
                  )}
                  {canDelete && <Button variant="outline" size="sm" className="w-full text-rose-700 border-rose-200 hover:bg-rose-50" leftIcon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Eliminar solicitud</Button>}
                </div>
              )
            ) : (
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <span>Trabajo Asignado</span>
                </div>
                <p>
                  Esta solicitud ya fue asignada formalmente. Puedes dar seguimiento al estado en tu panel de Trabajos Contratados.
                </p>
                <Link href={ROUTES.MY_ORDERS}>
                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    Ir a Mis Trabajos Contratados
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Client Card */}
          <Card className="border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Publicado por
            </h4>
            <div className="flex items-center gap-3">
              <Avatar
                src={jobRequest.user.avatarUrl}
                name={jobRequest.user.fullName}
                size="md"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{jobRequest.user.fullName}</h4>
                <p className="text-xs text-slate-500">{jobRequest.user.location || 'Cliente verificado'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal para enviar propuesta */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        jobRequestId={jobRequest.id}
        jobTitle={jobRequest.title}
        onSuccess={() => {
          setActionSuccessMessage('¡Propuesta enviada exitosamente al cliente!');
          loadJobRequest();
        }}
      />

      <ConfirmModal
        isOpen={!!proposalToAccept}
        onClose={() => setProposalToAccept(null)}
        onConfirm={() => proposalToAccept && handleAcceptProposal(proposalToAccept)}
        title="¿Aceptar esta propuesta?"
        description="Se formalizará una orden de trabajo y las demás propuestas quedarán cerradas."
        confirmLabel="Sí, contratar profesional"
        variant="primary"
        isConfirming={!!proposalToAccept && isAcceptingId === proposalToAccept}
      />
      <ConfirmModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={handleDelete} title="¿Eliminar esta solicitud?" description="Solo se puede eliminar mientras no tenga una contratación. Esta acción no se puede deshacer." confirmLabel="Sí, eliminar solicitud" variant="danger" isConfirming={isDeleting} />
    </PageContainer>
  );
}
