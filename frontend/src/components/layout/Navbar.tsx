'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  PlusCircle,
  Briefcase,
  Wrench,
  User as UserIcon,
  LogOut,
  Sparkles,
  ClipboardList,
  ChevronDown,
  Compass,
  Moon,
  Sun,
  ShieldCheck,
  Bell,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useUserMode } from '@/features/mode/context/ModeContext';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { ModeSwitcher } from '@/components/layout/ModeSwitcher';
import { ROUTES } from '@/constants/routes';
import { AppNotification, notificationsApi } from '@/services/api/endpoints';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { mode, isHiring } = useUserMode();
  const [showPublishMenu, setShowPublishMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExploreMenu, setShowExploreMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const savedTheme = window.localStorage.getItem('baxio-theme');
    const dark = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
  }, []);

  const loadNotifications = async () => {
    if (!user) return;
    try { const result = await notificationsApi.list(); setNotifications(result.items); setUnreadCount(result.unread); } catch { /* A notification failure never blocks navigation. */ }
  };

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return; }
    void loadNotifications();
    const timer = window.setInterval(() => void loadNotifications(), 30_000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  const openNotification = async (item: AppNotification) => {
    if (!item.isRead) { await notificationsApi.markRead(item.id).catch(() => undefined); setNotifications(current => current.map(entry => entry.id === item.id ? { ...entry, isRead: true } : entry)); setUnreadCount(current => Math.max(0, current - 1)); }
    setShowNotifications(false);
    const workOrderId = item.data?.workOrderId;
    router.push(workOrderId ? `${ROUTES.MY_ORDERS}?workOrder=${encodeURIComponent(workOrderId)}` : ROUTES.MY_ORDERS);
  };

  const toggleTheme = () => {
    const nextTheme = !isDark;
    setIsDark(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme);
    window.localStorage.setItem('baxio-theme', nextTheme ? 'dark' : 'light');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const destination = isHiring ? ROUTES.EXPLORE : ROUTES.JOB_REQUESTS;
      router.push(`${destination}?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center justify-between gap-2 lg:gap-3">
        {/* Brand Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 fill-white/30" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              BAXIO<span className="text-brand-600">.</span>
            </span>
            <span className="hidden xl:block text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              Servicios & Chamba
            </span>
          </div>
        </Link>

        {/* Mode Switcher Pill */}
        <div className="hidden xl:block">
          <ModeSwitcher />
        </div>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[11rem] xl:max-w-xs 2xl:max-w-sm mx-1">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="search"
              aria-label={isHiring ? 'Buscar servicios' : 'Buscar chamba'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isHiring
                  ? 'Buscar electricista, plomero, pintor...'
                  : 'Buscar solicitudes abiertas para postularte...'
              }
              className="w-full rounded-full border border-slate-200 bg-white/90 pl-10 pr-4 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </form>

        {/* Navigation Links */}
        <nav className="hidden lg:block relative">
          <button onClick={() => setShowExploreMenu(!showExploreMenu)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 hover:text-brand-700 ${pathname === ROUTES.EXPLORE || pathname === ROUTES.JOB_REQUESTS ? 'text-brand-700 bg-brand-50' : 'text-slate-600'}`}>
            <Compass className="w-4 h-4" /> Explorar <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {showExploreMenu && <><div className="fixed inset-0 z-10" onClick={() => setShowExploreMenu(false)} /><div className="absolute right-0 mt-2 z-20 w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl"><Link href={ROUTES.EXPLORE} onClick={() => setShowExploreMenu(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">Marketplace</Link><Link href={ROUTES.JOB_REQUESTS} onClick={() => setShowExploreMenu(false)} className="block rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">Tablero de solicitudes</Link></div></>}
        </nav>

        {/* Actions & User Menu */}
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggleTheme} aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'} title={isDark ? 'Modo claro' : 'Modo oscuro'} className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700 dark:hover:text-amber-200">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {isAuthenticated && user && <div className="relative">
            <button type="button" aria-label={`Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`} onClick={() => { setShowNotifications(value => !value); if (!showNotifications) void loadNotifications(); }} className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
              <Bell className="w-4 h-4" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showNotifications && <><div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} /><section aria-label="Notificaciones" className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700"><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notificaciones</h2><button onClick={async () => { await notificationsApi.markAllRead().catch(() => undefined); setNotifications(current => current.map(item => ({ ...item, isRead: true }))); setUnreadCount(0); }} disabled={!unreadCount} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 disabled:opacity-40"><CheckCheck className="w-3.5 h-3.5" /> Leer todas</button></div><div className="max-h-96 overflow-y-auto">{notifications.length === 0 ? <p className="p-5 text-center text-sm text-slate-500">Aún no tienes notificaciones.</p> : notifications.map(item => <button key={item.id} onClick={() => void openNotification(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${item.isRead ? '' : 'bg-brand-50/60 dark:bg-brand-950/20'}`}><span className="block text-xs font-bold text-slate-900 dark:text-slate-100">{item.title}</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">{item.message}</span><span className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('es-MX')}</span></button>)}</div></section></>}
          </div>}
          {/* Publish Dropdown */}
          <div className="relative">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => setShowPublishMenu(!showPublishMenu)}
              className="hidden sm:inline-flex"
            >
              Publicar
            </Button>

            {showPublishMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPublishMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <Link
                    href={ROUTES.NEW_JOB_REQUEST}
                    onClick={() => setShowPublishMenu(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Necesito un trabajo</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Publica lo que necesitas y recibe propuestas
                      </p>
                    </div>
                  </Link>
                  <Link
                    href={ROUTES.NEW_SERVICE}
                    onClick={() => setShowPublishMenu(false)}
                    className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Ofrezco mis servicios</p>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Crea un servicio en el marketplace
                      </p>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User authentication actions */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-brand-500/30 transition-all"
              >
                <Avatar src={user.avatarUrl} name={user.fullName} size="sm" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={ROUTES.PROFILE}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        Mi Perfil
                      </Link>
                      <Link
                        href={ROUTES.MY_ORDERS}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400"
                      >
                        <ClipboardList className="w-4 h-4 text-slate-400" />
                        Mis Trabajos Contratados
                      </Link>
                      {(user.role === 'ADMIN' || user.role === 'MODERATOR') && <Link href={ROUTES.ADMIN_REPORTS} onClick={() => setShowUserMenu(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400">
                        <ShieldCheck className="w-4 h-4 text-slate-400" /> Moderar reportes
                      </Link>}
                    </div>
                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-rose-300 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href={ROUTES.REGISTER} className="hidden 2xl:inline-flex">
                <Button variant="secondary" size="sm">
                  Registrarme
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
