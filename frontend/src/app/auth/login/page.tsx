'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login({ email: email.trim(), password });
      router.push(ROUTES.HOME);
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer size="sm" className="py-12 md:py-20 flex justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md shadow-brand-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Bienvenido de vuelta a BAXIO
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
              label="Correo Electrónico"
              type="email"
              placeholder="tu@correo.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-md"
                isLoading={isLoading}
              >
                Entrar a mi Cuenta
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 font-medium mb-2">
              Credenciales de prueba del seed:
            </p>
            <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-600 font-mono space-y-1">
              <div>kevin@baxio.com / password123 (Cliente)</div>
              <div>juan.electricista@baxio.com / password123 (Trabajador)</div>
            </div>
          </div>
        </Card>

        <p className="text-center text-xs text-slate-500">
          ¿No tienes una cuenta aún?{' '}
          <Link href={ROUTES.REGISTER} className="font-bold text-brand-600 hover:text-brand-700">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </PageContainer>
  );
}
