import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { formatAge, formatDate, formatEuros, labelCmg } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Fiche enfant — AssistantMat' };

export default async function EnfantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assistante } = await supabase
    .from('assistantes').select('id').eq('user_id', user.id).single();

  const { data: enfant } = await supabase
    .from('enfants')
    .select('*')
    .eq('id', id)
    .eq('assistante_id', assistante?.id ?? '')
    .single();

  if (!enfant) notFound();

  const { data: contrats } = await supabase
    .from('contrats')
    .select('*')
    .eq('enfant_id', id)
    .order('date_debut', { ascending: false });

  const contratActif = contrats?.find((c) => c.statut === 'actif');

  // Présences du mois courant
  const now = new Date();
  const debut = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const { data: presences } = await supabase
    .from('presences')
    .select('*')
    .eq('enfant_id', id)
    .gte('date', debut)
    .order('date', { ascending: false })
    .limit(10);

  const heuresMois = (presences ?? [])
    .filter((p) => p.type === 'presence')
    .reduce((s, p) => s + (p.heures_realisees ?? 0), 0);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/enfants" className="hover:text-slate-800 transition-colors">Mes enfants</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">{enfant.prenom} {enfant.nom}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
            👶
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{enfant.prenom} {enfant.nom}</h1>
            <p className="text-slate-500">
              {formatAge(enfant.date_naissance)} · né(e) le {formatDate(enfant.date_naissance, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <Link
          href={`/presences/nouveau?enfant_id=${enfant.id}`}
          className="bg-violet-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          + Présence
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Infos parents */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>👨‍👩‍👧</span> Parents
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900">{enfant.parent1_prenom} {enfant.parent1_nom}</p>
              {enfant.parent1_email && (
                <a href={`mailto:${enfant.parent1_email}`} className="text-violet-600 hover:underline">
                  {enfant.parent1_email}
                </a>
              )}
              {enfant.parent1_tel && <p className="text-slate-500">{enfant.parent1_tel}</p>}
            </div>
            {enfant.parent2_prenom && (
              <div className="pt-2 border-t border-slate-100">
                <p className="font-medium text-slate-900">{enfant.parent2_prenom} {enfant.parent2_nom}</p>
                {enfant.parent2_email && <p className="text-slate-500">{enfant.parent2_email}</p>}
              </div>
            )}
            {enfant.allocataire_caf && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-slate-500">N° CAF :</span>
                <span className="font-mono text-slate-700">{enfant.allocataire_caf}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contrat actif */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span>📄</span> Contrat
            </h2>
            {contratActif ? (
              <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-lg">Actif</span>
            ) : (
              <Link
                href={`/enfants/nouveau`}
                className="text-xs text-violet-600 hover:underline"
              >
                + Créer
              </Link>
            )}
          </div>

          {contratActif ? (
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Tarif horaire</span>
                <span className="font-medium text-slate-800">{formatEuros(contratActif.tarif_horaire)}/h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Heures / semaine</span>
                <span className="font-medium text-slate-800">{contratActif.heures_semaine}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jours</span>
                <span className="font-medium text-slate-800 capitalize">
                  {(contratActif.jours_semaine ?? []).join(', ') || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Entretien</span>
                <span className="font-medium text-slate-800">{formatEuros(contratActif.tarif_entretien)}/jour</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">CMG</span>
                <span className="font-medium text-slate-800">{labelCmg(contratActif.cmg_niveau)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between">
                <span className="text-slate-500">Depuis le</span>
                <span className="font-medium text-slate-800">{formatDate(contratActif.date_debut, 'dd/MM/yyyy')}</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Aucun contrat actif.</p>
          )}
        </div>

        {/* Présences du mois */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <span>📅</span> Présences récentes
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-normal">
                {heuresMois.toFixed(1)}h ce mois
              </span>
            </h2>
            <Link
              href={`/presences/nouveau?enfant_id=${enfant.id}`}
              className="text-xs text-violet-600 hover:underline"
            >
              + Ajouter
            </Link>
          </div>

          {!presences || presences.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-slate-400 text-sm">Aucune présence ce mois-ci.</p>
              <Link
                href={`/presences/nouveau?enfant_id=${enfant.id}`}
                className="mt-2 inline-block text-violet-600 text-sm hover:underline"
              >
                Enregistrer une présence →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {presences.map((p: {
                id: string;
                date: string;
                type: string;
                heure_debut?: string;
                heure_fin?: string;
                heures_realisees: number;
                repas: boolean;
              }) => {
                const typeColors: Record<string, string> = {
                  presence: 'bg-green-50 text-green-700',
                  absence_payee: 'bg-amber-50 text-amber-700',
                  absence_non_payee: 'bg-red-50 text-red-700',
                  conge_am: 'bg-blue-50 text-blue-700',
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
                  <div key={p.id} className="py-3 flex items-center gap-4">
                    <div className="w-16 text-xs text-slate-500 font-medium">
                      {formatDate(p.date, 'EEE dd')}
                    </div>
                    <div className="flex-1 text-sm">
                      {p.heure_debut && p.heure_fin && (
                        <span className="text-slate-600">
                          {p.heure_debut} → {p.heure_fin} ({p.heures_realisees.toFixed(1)}h)
                        </span>
                      )}
                      {p.repas && <span className="text-slate-400 ml-2 text-xs">🍽️</span>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${typeColors[p.type] ?? 'bg-slate-100 text-slate-600'}`}>
                      {typeLabels[p.type] ?? p.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
