import React from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-24 md:pb-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand */}
          <div className="md:col-span-1 space-y-4">
            <Link href={ROUTES.HOME} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                BAXIO<span className="text-brand-400">.</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed">
              La plataforma moderna que conecta de forma confiable a personas que ofrecen servicios y trabajos con quienes necesitan contratarlos.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Conexiones seguras y directas</span>
            </div>
          </div>

          {/* Categorías */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Categorías Populares
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/explore?category=electricidad" className="hover:text-white transition-colors">
                  Electricidad Residencial
                </Link>
              </li>
              <li>
                <Link href="/explore?category=plomeria" className="hover:text-white transition-colors">
                  Plomería y Fugas
                </Link>
              </li>
              <li>
                <Link href="/explore?category=minisplits-y-climas" className="hover:text-white transition-colors">
                  Climas y Minisplits
                </Link>
              </li>
              <li>
                <Link href="/explore?category=pintura" className="hover:text-white transition-colors">
                  Pintura e Impermeabilización
                </Link>
              </li>
              <li>
                <Link href="/explore?category=computadoras" className="hover:text-white transition-colors">
                  Soporte de Computadoras
                </Link>
              </li>
            </ul>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Plataforma
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href={ROUTES.EXPLORE} className="hover:text-white transition-colors">
                  Explorar Servicios
                </Link>
              </li>
              <li>
                <Link href={ROUTES.JOB_REQUESTS} className="hover:text-white transition-colors">
                  Tablero de Solicitudes
                </Link>
              </li>
              <li>
                <Link href={ROUTES.NEW_JOB_REQUEST} className="hover:text-white transition-colors">
                  Publicar un Trabajo
                </Link>
              </li>
              <li>
                <Link href={ROUTES.NEW_SERVICE} className="hover:text-white transition-colors">
                  Ofrecer un Servicio
                </Link>
              </li>
            </ul>
          </div>

          {/* Compromiso */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Garantía BAXIO
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Fomentamos la confianza mutua a través de nuestro sistema bidireccional de calificaciones y perfiles con portafolio real.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Respuesta rápida y presupuestos claros</span>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} BAXIO Platform. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <span>Hecho con</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>para impulsar el trabajo local</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
