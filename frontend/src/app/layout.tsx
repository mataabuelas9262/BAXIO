import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ModeProvider } from '@/features/mode/context/ModeContext';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNavigation } from '@/components/layout/MobileNavigation';
import { Footer } from '@/components/layout/Footer';
import { NoticeProvider } from '@/components/ui/NoticeProvider';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'BAXIO - Conecta Servicios y Trabajos de Confianza',
  description:
    'Plataforma moderna para contratar expertos verificados y encontrar oportunidades de trabajo en tu ciudad.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Leer el nonce de la petición obliga el renderizado dinámico necesario para
  // que Next.js lo propague a sus scripts y estilos internos.
  void (await headers()).get('x-nonce');

  return (
    <html lang="es" className="h-full bg-slate-50">
      <body className="flex min-h-full flex-col font-sans antialiased text-slate-900 bg-slate-50">
        <NoticeProvider><AuthProvider>
          <ModeProvider>
            <Navbar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <MobileNavigation />
            <Footer />
          </ModeProvider>
        </AuthProvider></NoticeProvider>
      </body>
    </html>
  );
}
