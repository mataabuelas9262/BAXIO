'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotice } from '@/components/ui/NoticeProvider';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Award,
  Save,
  CheckCircle2,
  Plus,
  ShieldCheck,
  GraduationCap,
  FileCheck,
  UploadCloud,
  FileText,
  X,
  Clock,
  Briefcase,
  Camera,
  Trash2,
  Pencil,
  Building2,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { usersApi, credentialsApi, experiencesApi, uploadsApi } from '@/services/api/endpoints';
import { Credential, Experience } from '@/types/common.types';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Rating } from '@/components/ui/Rating';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CredentialBadge } from '@/components/ui/CredentialBadge';
import { Badge } from '@/components/ui/Badge';
import { ROUTES } from '@/constants/routes';

export default function ProfilePage() {
  const showNotice = useNotice();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  // Refs de archivos
  const credFileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // Estados de información básica
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [professionalHeadline, setProfessionalHeadline] = useState(user?.professionalHeadline || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [telegram, setTelegram] = useState(user?.telegram || '');
  const [instagram, setInstagram] = useState(user?.instagram || '');
  const [facebook, setFacebook] = useState(user?.facebook || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [location, setLocation] = useState(user?.location || '');
  const [serviceArea, setServiceArea] = useState(user?.serviceArea || '');
  const [experienceYears, setExperienceYears] = useState(
    user?.experienceYears?.toString() || '0',
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Estados de credenciales
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);
  const [credType, setCredType] = useState('CERTIFICATION');
  const [credTitle, setCredTitle] = useState('');
  const [credIssuer, setCredIssuer] = useState('');
  const [credId, setCredId] = useState('');
  const [credIssueDate, setCredIssueDate] = useState('');
  const [credExpiryDate, setCredExpiryDate] = useState('');
  const [selectedCredFile, setSelectedCredFile] = useState<File | null>(null);
  const [isSubmittingCred, setIsSubmittingCred] = useState(false);

  // Estados de experiencias profesionales
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [expRole, setExpRole] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expIsFreelance, setExpIsFreelance] = useState(false);
  const [expStartYear, setExpStartYear] = useState(new Date().getFullYear() - 3);
  const [expEndYear, setExpEndYear] = useState<number | undefined>(new Date().getFullYear());
  const [expIsCurrent, setExpIsCurrent] = useState(false);
  const [expDescription, setExpDescription] = useState('');
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);

  // Mensajes de feedback
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [credNotice, setCredNotice] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: 'credential'; id: string }
    | { type: 'experience'; id: string }
    | null
  >(null);

  const loadData = async () => {
    try {
      const [credsData, expsData] = await Promise.all([
        credentialsApi.getMyCredentials(),
        experiencesApi.getMyExperiences(),
      ]);
      setCredentials(credsData);
      setExperiences(expsData);
    } catch {
      // Manejar error silenciosamente
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setProfessionalHeadline(user.professionalHeadline || '');
      setPhone(user.phone || '');
      setWhatsapp(user.whatsapp || '');
      setTelegram(user.telegram || '');
      setInstagram(user.instagram || '');
      setFacebook(user.facebook || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setServiceArea(user.serviceArea || '');
      setExperienceYears(user.experienceYears?.toString() || '0');
      setAvatarUrl(user.avatarUrl || '');
      loadData();
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <PageContainer>
        <EmptyState
          title="Inicia sesión para ver tu perfil"
          description="Administra tus datos personales, experiencia profesional y credenciales."
          actionLabel="Iniciar Sesión"
          onAction={() => router.push(ROUTES.LOGIN)}
        />
      </PageContainer>
    );
  }

  // 1. Guardar Información General
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSavedSuccess(false);

    try {
      await usersApi.updateProfile({
        fullName: fullName.trim(),
        professionalHeadline: professionalHeadline.trim() || undefined,
        phone: phone.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
        telegram: telegram.trim() || undefined,
        instagram: instagram.trim() || undefined,
        facebook: facebook.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        serviceArea: serviceArea.trim() || undefined,
        experienceYears: Number(experienceYears) || 0,
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Subida de Foto de Perfil Directa
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        showNotice('La imagen no debe exceder 5 MB');
        return;
      }

      setIsUploadingAvatar(true);
      try {
        const uploadRes = await uploadsApi.uploadAvatar(file);
        const newUrl = uploadRes.url;
        setAvatarUrl(newUrl);
        await usersApi.updateProfile({ avatarUrl: newUrl });
        await refreshUser();
        setAvatarNotice('¡Foto de perfil actualizada con éxito!');
        setTimeout(() => setAvatarNotice(''), 4000);
      } catch (err: any) {
        showNotice(err.message || 'Error al subir foto de perfil');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  // 3. Crear Credencial
  const handleCreateCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credTitle.trim() || !credIssuer.trim()) {
      showNotice('Por favor indica el nombre de la credencial y la institución emisora');
      return;
    }

    setIsSubmittingCred(true);
    let uploadedEvidenceUrl: string | undefined = undefined;

    try {
      if (selectedCredFile) {
        const uploadRes = await uploadsApi.uploadEvidence(selectedCredFile);
        uploadedEvidenceUrl = uploadRes.url;
      }

      await credentialsApi.create({
        type: credType,
        title: credTitle.trim(),
        issuer: credIssuer.trim(),
        credentialId: credId.trim() || undefined,
        issueDate: credIssueDate || undefined,
        expiryDate: credExpiryDate || undefined,
        evidenceUrl: uploadedEvidenceUrl,
      });

      await loadData();
      setIsCredModalOpen(false);

      setCredTitle('');
      setCredIssuer('');
      setCredId('');
      setCredIssueDate('');
      setCredExpiryDate('');
      setSelectedCredFile(null);

      setCredNotice(
        '¡Tu credencial fue registrada exitosamente! Se encuentra en estado "Pendiente de verificación". El equipo de BAXIO auditará la evidencia antes de otorgarle la insignia de Verificado ✓.',
      );
      setTimeout(() => setCredNotice(''), 7000);
    } catch (err: any) {
      showNotice(err.message || 'Error al registrar credencial');
    } finally {
      setIsSubmittingCred(false);
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      await credentialsApi.delete(id);
      await loadData();
    } catch (err: any) {
      showNotice(err.message || 'Error al eliminar');
    }
  };

  // 4. Modal de Experiencia: Abrir para crear o editar
  const openNewExperienceModal = () => {
    setEditingExpId(null);
    setExpRole('');
    setExpCompany('');
    setExpIsFreelance(false);
    setExpStartYear(new Date().getFullYear() - 2);
    setExpEndYear(new Date().getFullYear());
    setExpIsCurrent(false);
    setExpDescription('');
    setIsExpModalOpen(true);
  };

  const openEditExperienceModal = (exp: Experience) => {
    setEditingExpId(exp.id);
    setExpRole(exp.roleTitle);
    setExpCompany(exp.companyName || '');
    setExpIsFreelance(exp.isFreelance);
    setExpStartYear(exp.startYear);
    setExpEndYear(exp.endYear || undefined);
    setExpIsCurrent(exp.isCurrent);
    setExpDescription(exp.description || '');
    setIsExpModalOpen(true);
  };

  // 5. Guardar o Actualizar Experiencia
  const handleSaveExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expRole.trim()) {
      showNotice('Por favor indica el puesto o actividad principal');
      return;
    }

    const currentYear = new Date().getFullYear();
    const startY = Number(expStartYear);
    const endY = expEndYear ? Number(expEndYear) : undefined;

    if (isNaN(startY) || startY < 1960 || startY > currentYear) {
      showNotice(`El año de inicio debe ser un año válido entre 1960 y ${currentYear}`);
      return;
    }

    if (!expIsCurrent) {
      if (!endY || isNaN(endY)) {
        showNotice('Por favor indica el año de fin o marca la casilla "Actualmente activo"');
        return;
      }
      if (endY < startY) {
        showNotice('El año de fin no puede ser menor al año de inicio');
        return;
      }
      if (endY > currentYear + 1) {
        showNotice(`El año de fin no puede ser superior a ${currentYear + 1}`);
        return;
      }
    }

    setIsSubmittingExp(true);
    try {
      const payload = {
        roleTitle: expRole.trim(),
        companyName: expCompany.trim() || undefined,
        isFreelance: expIsFreelance,
        startYear: startY,
        endYear: expIsCurrent ? undefined : endY,
        isCurrent: expIsCurrent,
        description: expDescription.trim() || undefined,
      };

      if (editingExpId) {
        await experiencesApi.update(editingExpId, payload);
      } else {
        await experiencesApi.create(payload);
      }

      await loadData();
      setIsExpModalOpen(false);
    } catch (err: any) {
      showNotice(err.message || 'Error al guardar experiencia');
    } finally {
      setIsSubmittingExp(false);
    }
  };

  const handleDeleteExperience = async (id: string) => {
    try {
      await experiencesApi.delete(id);
      await loadData();
    } catch (err: any) {
      showNotice(err.message || 'Error al eliminar');
    }
  };

  return (
    <PageContainer size="md">
      <div className="mb-5 flex justify-end"><Link href="/profile/security" className="inline-flex items-center gap-2 rounded-xl border border-brand-400/40 bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-600 dark:text-brand-300"><ShieldCheck size={18} />Seguridad de mi cuenta</Link></div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Mi Perfil BAXIO
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Una misma cuenta para contratar y ofrecer servicios con total confianza.
        </p>
      </div>

      {savedSuccess && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Tu perfil se ha actualizado correctamente!</span>
        </div>
      )}

      {avatarNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-50 border border-brand-200 text-brand-800 text-sm font-medium flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
          <span>{avatarNotice}</span>
        </div>
      )}

      {credNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-start gap-3 animate-in fade-in">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-slate-900 mb-0.5">⌛ Pendiente de verificación</p>
            <p className="text-amber-800 leading-relaxed">{credNotice}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Avatar card with interactive photo uploader */}
        <div className="space-y-6">
          <Card className="p-6 text-center border-slate-200">
            {/* Interactive Avatar with Camera Button */}
            <div className="relative inline-block mx-auto mb-3">
              <Avatar
                src={avatarUrl || user.avatarUrl}
                name={fullName || user.fullName}
                size="xl"
                className="w-28 h-28 text-3xl shadow-md border-4 border-white"
              />
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 p-2.5 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-lg border-2 border-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={avatarFileRef}
                onChange={handleAvatarFileChange}
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
              />
            </div>

            <h3 className="text-base font-bold text-slate-900">{fullName || user.fullName}</h3>
            {professionalHeadline && (
              <p className="text-xs font-semibold text-brand-600 mt-0.5">{professionalHeadline}</p>
            )}
            <p className="text-xs text-slate-400 mt-1">{user.email}</p>

            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => avatarFileRef.current?.click()}
                isLoading={isUploadingAvatar}
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                {isUploadingAvatar ? 'Subiendo foto...' : 'Cambiar Foto de Perfil'}
              </Button>
            </div>

            {/* Reputation breakdown */}
            <div className="mt-5 pt-5 border-t border-slate-100 space-y-3 text-left">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Reputación Trabajador
                </span>
                <Rating
                  value={user.workerRatingAvg}
                  count={user.workerRatingCnt}
                  size="sm"
                />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Reputación Cliente
                </span>
                <Rating
                  value={user.clientRatingAvg}
                  count={user.clientRatingCnt}
                  size="sm"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Right column: Info Form, Experience & Credentials */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Form */}
          <Card className="p-6 border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
              Editar Información Personal
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre Completo *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Titular / Especialidad (Headline)"
                  placeholder="ej. Electricista residencial y comercial"
                  value={professionalHeadline}
                  onChange={(e) => setProfessionalHeadline(e.target.value)}
                  helperText="Se muestra debajo de tu nombre en las búsquedas."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Teléfono de Contacto"
                  placeholder="+52 81 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Años Totales de Experiencia"
                  type="number"
                  min={0}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ciudad / Ubicación"
                  placeholder="ej. Monterrey, NL"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Input
                  label="Zona de Cobertura"
                  placeholder="ej. Todo el municipio de San Pedro"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                />
              </div>

              {/* Canales de Contacto Directo y Redes Sociales */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Canales de Contacto y Redes Sociales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="WhatsApp de Contacto"
                    placeholder="ej. +52 81 8765 4321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    helperText="Enlace directo con mensaje pre-rellenado para clientes."
                  />
                  <Input
                    label="Usuario de Telegram"
                    placeholder="ej. @mi_usuario o t.me/..."
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Usuario de Instagram"
                    placeholder="ej. @mi_taller o instagram.com/..."
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                  <Input
                    label="Perfil o Página de Facebook"
                    placeholder="ej. facebook.com/mi_negocio"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                  />
                </div>
              </div>

              <Textarea
                label="Biografía / Presentación Profesional"
                placeholder="Cuéntale a la comunidad quién eres, tus especialidades y compromiso con la calidad..."
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSaving}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </Card>

          {/* Section: Trayectoria y Experiencia Profesional (Editable y Eliminable) */}
          <Card className="p-6 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-brand-600" />
                  <span>Trayectoria y Experiencia Profesional</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Muestra a tus clientes los trabajos, proyectos o trayectoria independiente que respalda tus servicios.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0 font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={openNewExperienceModal}
              >
                Agregar Experiencia
              </Button>
            </div>

            {experiences.length > 0 ? (
              <div className="space-y-3">
                {experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 flex items-start justify-between gap-4 group hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
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
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {exp.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditExperienceModal(exp)}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                        title="Editar experiencia"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'experience', id: exp.id })}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                        title="Eliminar experiencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-dashed border border-slate-200 rounded-2xl">
                <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No has agregado experiencia previa aún</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Agrega proyectos destacados, empresas donde colaboraste o tu trayectoria como técnico o profesional independiente.
                </p>
              </div>
            )}
          </Card>

          {/* Section: Credentials and Certifications Manager */}
          <Card className="p-6 border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-600" />
                  <span>Credenciales, Títulos y Certificaciones</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Las credenciales con evidencia son revisadas por el equipo de BAXIO para otorgar la insignia de verificación.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0 font-bold"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCredModalOpen(true)}
              >
                Agregar Credencial
              </Button>
            </div>

            {credentials.length > 0 ? (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <CredentialBadge
                    key={cred.id}
                    credential={cred}
                    onDelete={(id) => setDeleteTarget({ type: 'credential', id })}
                  />
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-dashed border border-slate-200 rounded-2xl">
                <GraduationCap className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No tienes credenciales registradas aún</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Agrega constancias DC-3, certificaciones NOM, diplomas o cédulas para aumentar la confianza de tus clientes.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal 1: Agregar Credencial */}
      <Modal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        title="Agregar Nueva Credencial o Título"
        description="Registra un certificado, diploma, licencia o cédula técnica"
      >
        <form onSubmit={handleCreateCredential} className="space-y-4 pt-2">
          <Select
            label="Tipo de Credencial *"
            value={credType}
            onChange={(e) => setCredType(e.target.value)}
            options={[
              { value: 'CERTIFICATION', label: 'Certificación Oficial (ej. NOM, DC-3)' },
              { value: 'DEGREE', label: 'Título Técnico / Licenciatura / Cédula' },
              { value: 'DIPLOMA', label: 'Diplomado o Especialización' },
              { value: 'LICENSE', label: 'Licencia / Matrícula Profesional' },
              { value: 'COURSE', label: 'Curso o Capacitación Acreditada' },
            ]}
          />

          <Input
            label="Nombre de la credencial *"
            placeholder="ej. DC-3 Seguridad en Trabajos en Altura, Técnico en Climas..."
            value={credTitle}
            onChange={(e) => setCredTitle(e.target.value)}
            required
          />

          <Input
            label="Institución Emisora *"
            placeholder="ej. STPS, Conalep, Colegio de Ingenieros, ICIC..."
            value={credIssuer}
            onChange={(e) => setCredIssuer(e.target.value)}
            required
          />

          <Input
            label="Folio / Cédula / Registro (Opcional)"
            placeholder="ej. STPS-DC3-NL-2023-88912"
            value={credId}
            onChange={(e) => setCredId(e.target.value)}
            helperText="Se utiliza para validación oficial y se muestra protegido en tu perfil."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:[&>div>label]:min-h-9">
            <Input
              label="Fecha de Emisión (Opcional)"
              type="date"
              value={credIssueDate}
              onChange={(e) => setCredIssueDate(e.target.value)}
            />

            <Input
              label="Fecha de Vencimiento (Opcional)"
              type="date"
              value={credExpiryDate}
              onChange={(e) => setCredExpiryDate(e.target.value)}
            />
          </div>

          {/* Subida de archivo de evidencia */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Evidencia / Comprobante Oficial (Opcional)
            </label>

            <input
              type="file"
              ref={credFileRef}
              aria-label="Archivo de evidencia"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedCredFile(e.target.files[0]);
                }
              }}
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />

            {selectedCredFile ? (
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {selectedCredFile.name}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {(selectedCredFile.size / 1024).toFixed(1)} KB • Listo para adjuntar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCredFile(null);
                    if (credFileRef.current) credFileRef.current.value = '';
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => credFileRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-slate-200 hover:border-brand-400 rounded-2xl bg-slate-50/60 hover:bg-brand-50/30 transition-all flex flex-col items-center justify-center gap-1.5 text-center group cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-white shadow-subtle group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Haz clic para subir tu documento o constancia
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    PDF hasta 10 MB; fotos JPG, PNG o WebP hasta 5 MB.
                  </p>
                </div>
              </button>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCredModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingCred}
            >
              Registrar Credencial
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Agregar / Editar Experiencia Profesional */}
      <Modal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        title={editingExpId ? 'Editar Experiencia Profesional' : 'Agregar Experiencia Profesional'}
        description="Registra actividades, proyectos o trayectoria relevante para los servicios que ofreces"
      >
        <form onSubmit={handleSaveExperience} className="space-y-4 pt-2">
          <Input
            label="Puesto o Actividad Principal *"
            placeholder="ej. Técnico en Climas y Refrigeración, Albañil Especialista..."
            value={expRole}
            onChange={(e) => setExpRole(e.target.value)}
            required
          />

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={expIsFreelance}
                onChange={(e) => setExpIsFreelance(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-800">
                Trabajé de forma independiente / Por cuenta propia
              </span>
            </label>

            {expIsFreelance ? (
              <Input
                label="Nombre comercial de tu taller o negocio (Opcional)"
                placeholder="ej. Reparaciones Juancho, Servicios Eléctricos Pérez (o dejar vacío)"
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
              />
            ) : (
              <Input
                label="Empresa, Taller o Contratista *"
                placeholder="ej. Climas González, Constructora Regiomontana..."
                value={expCompany}
                onChange={(e) => setExpCompany(e.target.value)}
                required
              />
            )}
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Año de Inicio *"
                type="number"
                min={1960}
                max={new Date().getFullYear()}
                value={expStartYear}
                onChange={(e) => setExpStartYear(Number(e.target.value))}
                required
              />

              {!expIsCurrent ? (
                <Input
                  label="Año de Fin *"
                  type="number"
                  min={expStartYear || 1960}
                  max={new Date().getFullYear() + 1}
                  value={expEndYear || ''}
                  onChange={(e) => setExpEndYear(Number(e.target.value))}
                  required
                />
              ) : (
                <div className="flex flex-col justify-end">
                  <span className="text-xs font-bold text-brand-700 bg-brand-50 py-3 px-3 rounded-xl border border-brand-200 text-center">
                    ⚡ Actualidad
                  </span>
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={expIsCurrent}
                onChange={(e) => setExpIsCurrent(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-slate-300"
              />
              <span className="text-xs text-slate-700 font-medium">
                Trabajo o desempeño esta actividad actualmente
              </span>
            </label>
          </div>

          <Textarea
            label="Descripción Breve (Opcional)"
            placeholder="ej. Mantenimiento preventivo de minisplits, detección de fugas y cambio de compresores."
            rows={2}
            value={expDescription}
            onChange={(e) => setExpDescription(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsExpModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmittingExp}
            >
              {editingExpId ? 'Guardar Cambios' : 'Agregar Experiencia'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'credential') {
            await handleDeleteCredential(deleteTarget.id);
          } else {
            await handleDeleteExperience(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
        title={deleteTarget?.type === 'credential' ? '¿Eliminar credencial?' : '¿Eliminar experiencia?'}
        description={deleteTarget?.type === 'credential' ? 'Esta credencial dejará de mostrarse en tu perfil.' : 'Este registro dejará de mostrarse en tu trayectoria profesional.'}
        confirmLabel="Sí, eliminar"
        variant="danger"
      />
    </PageContainer>
  );
}
