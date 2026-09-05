'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Plus,
  ClipboardList,
  User as UserIcon,
  Briefcase,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUserMode } from '@/features/mode/context/ModeContext';
import { ROUTES } from '@/constants/routes';
import { Modal } from '@/components/ui/Modal';
import { ModeSwitcher } from '@/components/layout/ModeSwitcher';

export const MobileNavigation: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const { isHiring, isWorking, toggleMode } = useUserMode();
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const navItems = [
    { label: 'Inicio', href: ROUTES.HOME, icon: Home },
    { label: isHiring ? 'Explorar' : 'Solicitudes', href: isHiring ? ROUTES.EXPLORE : ROUTES.JOB_REQUESTS, icon: isHiring ? Search : Briefcase },
    {
      label: 'Publicar',
      href: '#',
      icon: Plus,
      isAction: true,
      onClick: () => setIsPublishModalOpen(true),
    },
    { label: 'Trabajos', href: ROUTES.MY_ORDERS, icon: ClipboardList },
    {
      label: 'Perfil',
      href: isAuthenticated ? ROUTES.PROFILE : ROUTES.LOGIN,
      icon: UserIcon,
    },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-40 w-full glass-panel border-t border-slate-200/80 md:hidden pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="flex flex-col items-center justify-center -mt-5 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-transform group-active:scale-95 ${
                      isHiring
                        ? 'bg-brand-600 shadow-brand-500/30'
                        : 'bg-amber-500 shadow-amber-500/30'
                    }`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 mt-1">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex flex-col items-center justify-center w-14 py-1 transition-colors ${
                  isActive
                    ? isHiring
                      ? 'text-brand-600'
                      : 'text-amber-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Modal de Publicación Móvil */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        title="¿Qué deseas hacer hoy?"
        description="Selecciona una opción o cambia de modo"
      >
        <div className="space-y-4 pt-2">
          {/* Switcher in modal */}
          <div className="flex justify-center pb-2">
            <ModeSwitcher />
          </div>

          <Link
            href={ROUTES.NEW_JOB_REQUEST}
            onClick={() => setIsPublishModalOpen(false)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
              isHiring
                ? 'border-brand-300 bg-brand-50/50 shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="p-3 rounded-xl bg-amber-100 text-amber-700 group-hover:scale-105 transition-transform">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Necesito contratar un trabajo</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Describe lo que requieres y recibe ofertas de trabajadores en tu zona.
              </p>
            </div>
          </Link>

          <Link
            href={ROUTES.NEW_SERVICE}
            onClick={() => setIsPublishModalOpen(false)}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
              isWorking
                ? 'border-amber-300 bg-amber-50/50 shadow-sm'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="p-3 rounded-xl bg-brand-100 text-brand-700 group-hover:scale-105 transition-transform">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Quiero ofrecer mis servicios</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Publica tu oficio con precio base y llega a cientos de clientes.
              </p>
            </div>
          </Link>
        </div>
      </Modal>
    </>
  );
};
