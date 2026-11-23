import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'TaskFlow — Gestor de Tareas e Incidencias',
  description:
    'Gestor CRUD de tareas e incidencias en Next.js App Router, TypeScript, Tailwind CSS y Supabase.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen antialiased selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
