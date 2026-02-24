import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Présences — AssistantMat' };

// Derniers 14 jours
function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
}

export default async function PresencesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assistante } = await supabase
    .from('assistantes').select('id').eq('user_id', user.id).single();

  const days = getLast14Days();
  const from = days[days.length - 1];
  const to = days[0];

  const { data: presences } = await supabase
    .from('presences')
    .select('*, enfants(id, prenom, nom)')
    .eq('assistante_id', assistante?.id ?? '')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  const { data: enfants } = await supabase
    .from('enfants')
    .select('id, prenom, nom')
    .eq('assistante_id', assistante?.id ?? '')
    .is('archived_at', null);

  // Group presences by date
  const byDate: Record<string, typeof presences> = {};
  (presences ?? []).forEach((p) => {
    if (!byDate[p.date]) byDate[p.date] = [];
    byDate[p.date]!.push(p);
  });

  const typeColors: Record<string, string> = {
    presence: 'bg-green-50 text-green-700',
    absence_payee: 'bg-amber-50 text-amber-700',
    absence_non_payee: 'bg-red-50 text-red-700',
    conge_am: 'bg-blue-50 text-blue-700',
    jf_non_travaille: 'bg-slate-100 text-slate-600',
    fermeture: 'bg-slate-100 text-slate-600',
  };
  const typeLabels: Record<string, string> = {
    presence: 'Présence',
    absence_payee: 'Absence payée',
    absence_non_payee: 'Absence non payée',
    conge_am: 'Congé AM',
    jf_non_travaille: 'Jour férié',
    fermeture: 'Fermeture',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feuilles de présence</h1>
          <p className="text-slate-500 mt-1">14 derniers jours</p>
        </div>
        <Link
          href="/presences/nouveau"
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
        >
          + Enregistrer une présence
        </Link>
      </div>

      {!enfants || enfants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="font-semibold text-slate-900 text-lg mb-2">
            Ajoutez d&apos;abord un enfant
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Les présences sont liées à des enfants et contrats actifs.
          </p>
          <Link
            href="/enfants/nouveau"
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Ajouter un enfant →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const dayPresences = byDate[day] ?? [];
            const isToday = day === new Date().toISOString().split('T')[0];
            return (
              <div key={day} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className={`px-6 py-3 flex items-center justify-between border-b ${isToday ? 'bg-violet-50 border-violet-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    {isToday && <span className="text-xs bg-violet-600 text-white px-2 py-0.5 rounded-full font-medium">Aujourd&apos;hui</span>}
                    <span className="font-semibold text-slate-800 text-sm">
                      {formatDate(day, 'EEEE d MMMM')}
                    </span>
                  </div>
                  <Link
                    href={`/presences/nouveau?date=${day}`}
                    className="text-xs text-violet-600 hover:underline"
                  >
                    + Ajouter
                  </Link>
                </div>
                {dayPresences.length === 0 ? (
                  <div className="px-6 py-4 text-slate-400 text-sm italic">Aucune présence enregistrée</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {dayPresences.map((p: {
                      id: string;
                      type: string;
                      heure_debut?: string;
                      heure_fin?: string;
                      heures_realisees: number;
                      repas: boolean;
                      notes?: string;
                      enfants: { id: string; prenom: string; nom: string }[] | null;
                    }) => (
                      <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                          👶
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-slate-800 text-sm">
                            {p.enfants?.[0]?.prenom} {p.enfants?.[0]?.nom}
                          </span>
                          {p.heure_debut && p.heure_fin && (
                            <span className="text-slate-500 text-xs ml-2">
                              {p.heure_debut} → {p.heure_fin} ({p.heures_realisees.toFixed(1)}h)
                            </span>
                          )}
                          {p.repas && <span className="text-slate-400 text-xs ml-2">🍽️ Repas</span>}
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-lg ${typeColors[p.type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {typeLabels[p.type] ?? p.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
