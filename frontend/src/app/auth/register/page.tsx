'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, User as UserIcon, Phone, MapPin } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OtpChallenge } from '@/features/auth/components/OtpChallenge';
import { AuthStep } from '@/services/api/endpoints';
import { ROUTES } from '@/constants/routes';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<AuthStep | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      setError('Por favor llena todos los campos obligatorios');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
      });
      setPassword('');
      if ('step' in result) setChallenge(result);
      else router.push(ROUTES.HOME);
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  if (challenge) return <PageContainer size="sm" className="py-12 md:py-20 flex justify-center"><Card className="w-full max-w-md p-6 sm:p-8"><OtpChallenge initial={challenge} onDone={() => router.push(ROUTES.HOME)} onBack={() => setChallenge(null)} /></Card></PageContainer>;

  return (
    <PageContainer size="sm" className="py-12 md:py-20 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Crear Cuenta en BAXIO
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Una sola cuenta para contratar y ofrecer servicios
          </p>
        </div>

        <Card className="p-6 sm:p-8 border-slate-200 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
                {error}
              </div>
            )}

            <Input
              label="Nombre Completo *"
              placeholder="ej. Carlos Mendoza"
              leftIcon={<UserIcon className="w-4 h-4" />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Correo Electrónico *"
              type="email"
              placeholder="tu@correo.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña (mínimo 6 caracteres) *"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Teléfono (Opcional)"
                placeholder="+52 81 1234 5678"
                leftIcon={<Phone className="w-4 h-4" />}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <Input
                label="Ciudad (Opcional)"
                placeholder="ej. Monterrey"
                leftIcon={<MapPin className="w-4 h-4" />}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-md"
                isLoading={isLoading}
              >
                Crear mi Cuenta Gratis
              </Button>
            </div>
          </form>
        </Card>

        <p className="text-center text-xs text-slate-500">
          ¿Ya tienes una cuenta?{' '}
          <Link href={ROUTES.LOGIN} className="font-bold text-brand-600 hover:text-brand-700">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
