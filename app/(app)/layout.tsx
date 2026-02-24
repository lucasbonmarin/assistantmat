import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed top-0 bottom-0 left-0">
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100">
          <span className="text-2xl">🧸</span>
          <span className="font-bold text-slate-900">AssistantMat</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', emoji: '📊', label: 'Tableau de bord' },
            { href: '/enfants', emoji: '👶', label: 'Mes enfants' },
            { href: '/presences', emoji: '📅', label: 'Présences' },
            { href: '/factures', emoji: '💶', label: 'Factures' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm"
            >
              <span className="text-base">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100">
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors text-sm flex items-center gap-3"
            >
              <span>🚪</span>
              <span>Déconnexion</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}
