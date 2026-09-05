'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  DollarSign,
  User as UserIcon,
  MapPin,
  Calendar,
  Star,
  AlertCircle,
  Sparkles,
  ExternalLink,
  Lock,
  MessageCircle,
} from 'lucide-react';
import { workOrdersApi } from '@/services/api/endpoints';
import { WorkOrder, Review } from '@/types/common.types';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ReviewModal } from '@/features/reviews/components/ReviewModal';
import { OrderChatModal } from '@/features/messages/components/OrderChatModal';
import { ContactChannelButtons } from '@/components/ui/ContactChannelButtons';
import { ROUTES } from '@/constants/routes';

export default function MyOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<
    | { type: 'request-completion'; orderId: string }
    | { type: 'confirm-completion'; order: WorkOrder }
    | null
  >(null);

  // Review modal state
  const [reviewModalData, setReviewModalData] = useState<{
    workOrderId: string;
    targetName: string;
    targetRole: 'profesional' | 'cliente';
  } | null>(null);
  const [chatOrder, setChatOrder] = useState<WorkOrder | null>(null);

  const loadOrders = async () => {
    try {
      const data = await workOrdersApi.getMyOrders();
      setOrders(data);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Manejador de solicitud de finalización por parte del trabajador
  const handleRequestCompletion = async (orderId: string) => {
    setUpdatingId(orderId);
    try {
      await workOrdersApi.updateStatus(orderId, 'COMPLETION_PENDING');
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Error al solicitar finalización');
    } finally {
      setUpdatingId(null);
      setConfirmation(null);
    }
  };

  // Manejador de confirmación / completado por parte del cliente
  const handleConfirmCompletion = async (order: WorkOrder) => {
    setUpdatingId(order.id);
    try {
      await workOrdersApi.updateStatus(order.id, 'COMPLETED');
      await loadOrders();

      // Abrir de inmediato el modal de calificación para el cliente
      setReviewModalData({
        workOrderId: order.id,
        targetName: order.worker?.fullName || 'el profesional',
        targetRole: 'profesional',
      });
    } catch (err: any) {
      alert(err.message || 'Error al confirmar la finalización del trabajo');
    } finally {
      setUpdatingId(null);
      setConfirmation(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <PageContainer>
        <EmptyState
          title="Inicia sesión para ver tus trabajos contratados"
          description="Aquí podrás dar seguimiento a los contratos activos y trabajos finalizados."
          actionLabel="Iniciar Sesión"
          onAction={() => (window.location.href = ROUTES.LOGIN)}
        />
      </PageContainer>
    );
  }

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'IN_PROGRESS') return o.status === 'IN_PROGRESS' || o.status === 'COMPLETION_PENDING';
    return o.status === filterStatus;
  });

  const statusVariant = {
    IN_PROGRESS: 'warning' as const,
    COMPLETION_PENDING: 'purple' as const,
    COMPLETED: 'success' as const,
    CANCELLED: 'danger' as const,
    DISPUTED: 'danger' as const,
  };

  const statusLabel = {
    IN_PROGRESS: 'En Progreso',
    COMPLETION_PENDING: 'Esperando Confirmación',
    COMPLETED: 'Completado',
    CANCELLED: 'Cancelado',
    DISPUTED: 'En Disputa',
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold mb-2">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Gestión de Contratos Formales</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Mis Trabajos Contratados (WorkOrders)
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Seguimiento formal de trabajos asignados entre clientes y profesionales.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        {(['ALL', 'IN_PROGRESS', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterStatus(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL' ? 'Todos' : tab === 'IN_PROGRESS' ? 'En Progreso' : 'Completados'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {isLoading ? (
        <LoadingState message="Cargando órdenes de trabajo..." />
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isClient = order.clientId === user?.id;
            const counterpart = isClient ? order.worker : order.client;
            const counterpartRole = isClient ? 'Trabajador asignado' : 'Cliente contratante';

            const myReview = order.reviews?.find((r: Review) => r.authorId === user?.id);

            return (
              <Card key={order.id} className="p-6 border-slate-200 shadow-sm space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400">
                      ORDEN #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                      {order.jobRequest?.title || 'Orden de Trabajo BAXIO'}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Monto Acordado
                      </span>
                      <span className="text-lg font-extrabold text-brand-700 dark:text-sky-300">
                        ${Number(order.agreedPrice).toLocaleString('es-MX')} MXN
                      </span>
                    </div>
                    <Badge variant={statusVariant[order.status]} size="md">
                      {statusLabel[order.status]}
                    </Badge>
                  </div>
                </div>

                {/* Counterpart info and dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-1">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={counterpart?.avatarUrl}
                      name={counterpart?.fullName}
                      size="md"
                    />
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        {counterpartRole}
                      </span>
                      <p className="text-sm font-bold text-slate-900">{counterpart?.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 sm:justify-end">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Inicio:{' '}
                        {new Date(order.startDate).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    {order.completedDate && (
                      <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          Finalizado:{' '}
                          {new Date(order.completedDate).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<MessageCircle className="w-4 h-4" />}
                    onClick={() => setChatOrder(order)}
                  >
                    Mensajes
                  </Button>
                </div>

                {counterpart && <ContactChannelButtons user={counterpart} />}

                {/* Dirección Confidencial Desbloqueada por WorkOrder */}
                {order.jobRequest && (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-2 dark:bg-emerald-950/35 dark:border-emerald-800/80">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-950 dark:text-emerald-100">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Dirección del Trabajo (Confidencial)</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200 dark:text-emerald-200 dark:bg-emerald-500/15 dark:border-emerald-700">
                        <Lock className="w-2.5 h-2.5" />
                        Desbloqueada por Contrato
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 space-y-0.5 dark:text-slate-200">
                      {order.jobRequest.exactAddress ? (
                        <p className="font-extrabold text-slate-900 text-xs dark:text-white">
                          {order.jobRequest.exactAddress}
                        </p>
                      ) : (
                        <p className="text-slate-500 italic text-[11px] dark:text-slate-400">
                          Sin dirección específica detallada por el cliente.
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        Zona: {order.jobRequest.location}
                      </p>
                    </div>

                    {order.jobRequest.exactAddress && (
                      <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap items-center gap-2 dark:border-emerald-800/70">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.jobRequest.exactAddress + ', ' + order.jobRequest.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold rounded-xl transition-colors shadow-2xs dark:bg-emerald-950/70 dark:hover:bg-emerald-900 dark:border-emerald-700 dark:text-emerald-100"
                        >
                          <ExternalLink className="w-3 h-3 text-emerald-600" />
                          <span>Abrir en Google Maps</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?q=${encodeURIComponent(order.jobRequest.exactAddress + ', ' + order.jobRequest.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold rounded-xl transition-colors shadow-2xs dark:bg-sky-950/50 dark:hover:bg-sky-900 dark:border-sky-700 dark:text-sky-100"
                        >
                          <ExternalLink className="w-3 h-3 text-sky-600" />
                          <span>Abrir en Waze</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Notice (if COMPLETION_PENDING) */}
                {order.status === 'COMPLETION_PENDING' && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      {isClient ? (
                        <div>
                          <p className="font-bold text-amber-900">
                            El profesional ha solicitado la finalización del trabajo.
                          </p>
                          <p className="text-amber-700 mt-0.5">
                            Por favor revisa que todo esté en orden antes de confirmar la finalización.
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-amber-900">
                            Solicitud de finalización enviada al cliente.
                          </p>
                          <p className="text-amber-700 mt-0.5">
                            Esperando que el cliente confirme para habilitar las calificaciones.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Review status display (if COMPLETED and reviewed) */}
                {order.status === 'COMPLETED' && myReview && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-400">
                        {Array.from({ length: myReview.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        Calificaste este trabajo con {myReview.rating} estrellas
                      </span>
                    </div>
                    {myReview.comment && (
                      <p className="text-xs text-slate-500 italic max-w-md line-clamp-1">
                        "{myReview.comment}"
                      </p>
                    )}
                  </div>
                )}

                {/* Actions Footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    href={ROUTES.JOB_REQUEST_DETAIL(order.jobRequestId)}
                    className="text-xs font-bold text-brand-600 hover:text-brand-700"
                  >
                    Ver Solicitud Original →
                  </Link>

                  <div className="flex items-center gap-2">
                    {/* Botón de solicitar finalización para el trabajador */}
                    {!isClient && order.status === 'IN_PROGRESS' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={updatingId === order.id}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => setConfirmation({ type: 'request-completion', orderId: order.id })}
                      >
                        Solicitar Finalización de Trabajo
                      </Button>
                    )}

                    {/* Botón de confirmación para el cliente */}
                    {isClient && order.status === 'COMPLETION_PENDING' && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={updatingId === order.id}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => setConfirmation({ type: 'confirm-completion', order })}
                      >
                        ✓ Confirmar y Finalizar Trabajo
                      </Button>
                    )}

                    {/* Botón de finalización directa para el cliente si aún está en progreso */}
                    {isClient && order.status === 'IN_PROGRESS' && (
                      <Button
                        variant="outline"
                        size="sm"
                        isLoading={updatingId === order.id}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        onClick={() => setConfirmation({ type: 'confirm-completion', order })}
                      >
                        Marcar como Trabajo Completado
                      </Button>
                    )}

                    {/* Botón para calificar cuando la orden está COMPLETED y aún no ha calificado */}
                    {order.status === 'COMPLETED' && !myReview && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Star className="w-4 h-4 text-amber-300 fill-amber-300" />}
                        onClick={() =>
                          setReviewModalData({
                            workOrderId: order.id,
                            targetName: counterpart?.fullName || 'el usuario',
                            targetRole: isClient ? 'profesional' : 'cliente',
                          })
                        }
                      >
                        Calificar a {counterpart?.fullName}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No tienes órdenes de trabajo en este estado"
          description="Cuando aceptes o te acepten una propuesta a una solicitud, aquí se gestionará el contrato."
          actionLabel="Explorar Solicitudes"
          onAction={() => (window.location.href = ROUTES.JOB_REQUESTS)}
        />
      )}

      {/* Review Modal */}
      {reviewModalData && (
        <ReviewModal
          isOpen={!!reviewModalData}
          onClose={() => setReviewModalData(null)}
          workOrderId={reviewModalData.workOrderId}
          targetName={reviewModalData.targetName}
          targetRole={reviewModalData.targetRole}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}

      <OrderChatModal
        isOpen={!!chatOrder}
        onClose={() => setChatOrder(null)}
        order={chatOrder}
        currentUserId={user?.id}
      />

      <ConfirmModal
        isOpen={!!confirmation}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (!confirmation) return;
          if (confirmation.type === 'request-completion') {
            handleRequestCompletion(confirmation.orderId);
            return;
          }
          handleConfirmCompletion(confirmation.order);
        }}
        title={confirmation?.type === 'request-completion' ? '¿Solicitar finalización?' : '¿Confirmar trabajo terminado?'}
        description={
          confirmation?.type === 'request-completion'
            ? 'El cliente recibirá una solicitud para revisar y confirmar que el trabajo quedó concluido.'
            : 'Confirma únicamente si el trabajo quedó realizado a tu entera satisfacción. Después podrás calificar al profesional.'
        }
        confirmLabel={confirmation?.type === 'request-completion' ? 'Enviar solicitud' : 'Sí, finalizar trabajo'}
        variant={confirmation?.type === 'request-completion' ? 'warning' : 'primary'}
        isConfirming={!!confirmation && updatingId === (confirmation.type === 'request-completion' ? confirmation.orderId : confirmation.order.id)}
      />
    </PageContainer>
  );
}
