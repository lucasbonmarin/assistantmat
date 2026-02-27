import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calculerFacturesMois, genererFacturesMois } from '@/lib/actions/factures';
import { formatEuros, formatMoisAnnee, getMoisCourant } from '@/lib/utils';
async function genererAction(formData: FormData): Promise<void> {
  'use server';
  await genererFacturesMois(formData);
}
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Générer les factures — AssistantMat' };

function getMoisOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      mois: d.getMonth() + 1,
      annee: d.getFullYear(),
      label: formatMoisAnnee(d.getMonth() + 1, d.getFullYear()),
    });
  }
  return options;
}

export default async function GenererFacturesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { mois: moisCourant, annee: anneeCourante } = getMoisCourant();
  // Par défaut, le mois PRÉCÉDENT (pour facturer le mois terminé)
  const defaultDate = new Date();
  defaultDate.setMonth(defaultDate.getMonth() - 1);
  const defaultMois = defaultDate.getMonth() + 1;
  const defaultAnnee = defaultDate.getFullYear();

  const mois = params.mois ? parseInt(params.mois) : defaultMois;
  const annee = params.annee ? parseInt(params.annee) : defaultAnnee;
  const moisOptions = getMoisOptions();

  // Calculer la prévisualisation
  const { previews, error } = await calculerFacturesMois(mois, annee);

  // Total global
  const totalFacture = (previews ?? []).reduce((s, p) => s + p.calcul.total_facture, 0);
  const totalCmg = (previews ?? []).reduce((s, p) => s + p.calcul.cmg_montant, 0);
  const totalNetAm = (previews ?? []).reduce((s, p) => s + p.calcul.salaire_net, 0);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/factures" className="hover:text-slate-800 transition-colors">Factures</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">Générer les factures</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Générer les factures</h1>
      <p className="text-slate-500 text-sm mb-8">
        AssistantMat calcule automatiquement les cotisations PAJEMPLOI et déduit le CMG pour chaque enfant.
      </p>

      {/* Sélection du mois */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Mois à facturer</label>
        <div className="flex flex-wrap gap-2">
          {moisOptions.map((opt) => {
            const isCurrent = opt.mois === moisCourant && opt.annee === anneeCourante;
            const isSelected = opt.mois === mois && opt.annee === annee;
            return (
              <a
                key={`${opt.annee}-${opt.mois}`}
                href={`/factures/generer?mois=${opt.mois}&annee=${opt.annee}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
                  isSelected
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
                {isCurrent && <span className="ml-1 text-xs opacity-70">(en cours)</span>}
              </a>
            );
          })}
        </div>
      </div>

      {/* Erreur ou aperçu */}
      {error ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <p className="font-medium text-amber-800 mb-1">{error}</p>
          <p className="text-sm text-amber-600">
            Ajoutez des enfants avec des contrats actifs pour générer des factures.
          </p>
          <Link
            href="/enfants/nouveau"
            className="mt-4 inline-block bg-violet-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
          >
            Ajouter un enfant →
          </Link>
        </div>
      ) : (
        <>
          {/* Résumé global */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Total facturé', value: formatEuros(totalFacture), emoji: '💶', note: 'Coût total parents' },
              { label: 'CMG total', value: formatEuros(totalCmg), emoji: '🏦', note: 'Aide CAF déduite' },
              { label: 'Votre net', value: formatEuros(totalNetAm), emoji: '✅', note: 'Votre salaire net' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                  <span>{item.emoji}</span>
                  <span>{item.label}</span>
                </div>
                <div className="text-xl font-bold text-slate-900">{item.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.note}</div>
              </div>
            ))}
          </div>

          {/* Détail par enfant */}
          <div className="space-y-3 mb-6">
            {(previews ?? []).map((preview) => {
              const { calcul } = preview;
              return (
                <div key={preview.enfant_id} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                        👶
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {preview.prenom} {preview.nom}
                        </p>
                        <p className="text-sm text-slate-500">
                          {preview.heures_realisees.toFixed(1)}h réalisées · {preview.jours_presences} jour{preview.jours_presences > 1 ? 's' : ''}
                          {preview.repas > 0 && ` · ${preview.repas} repas`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-violet-600">
                        {formatEuros(calcul.total_facture)}
                      </div>
                      <div className="text-xs text-slate-400">total famille</div>
                    </div>
                  </div>

                  {/* Détail calcul */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    {calcul.detail.mensualisation && (
                      <div className="flex justify-between text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                        <span>⚠️ Mensualisation appliquée</span>
                        <span>{calcul.heures_facturees.toFixed(1)}h facturées (87% des heures contractuelles)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-600">
                      <span>Heures facturées</span>
                      <span>{calcul.heures_facturees.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Salaire brut</span>
                      <span>{formatEuros(calcul.salaire_brut)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>— Cotisations salariales ({(calcul.detail.taux_salarial * 100).toFixed(1)}%)</span>
                      <span>− {formatEuros(calcul.cotisations_salariales)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>Salaire net AM</span>
                      <span>{formatEuros(calcul.salaire_net)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>+ Charges patronales ({(calcul.detail.taux_patronal * 100).toFixed(1)}%)</span>
                      <span>+ {formatEuros(calcul.cotisations_patronales)}</span>
                    </div>
                    {calcul.frais_entretien > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>+ Frais d'entretien</span>
                        <span>+ {formatEuros(calcul.frais_entretien)}</span>
                      </div>
                    )}
                    {calcul.frais_repas > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>+ Repas ({preview.repas}×)</span>
                        <span>+ {formatEuros(calcul.frais_repas)}</span>
                      </div>
                    )}
                    {calcul.cmg_eligible && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>— CMG CAF</span>
                        <span>− {formatEuros(calcul.cmg_montant)}</span>
                      </div>
                    )}
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                      <span>Total pour la famille</span>
                      <span>{formatEuros(calcul.total_facture)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Confirmation */}
          <div className="bg-violet-50 border border-violet-100 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="text-2xl">⚡</div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 mb-1">
                  Générer {previews?.length ?? 0} facture{(previews?.length ?? 0) > 1 ? 's' : ''} pour {formatMoisAnnee(mois, annee)}
                </p>
                <p className="text-sm text-slate-600 mb-4">
                  Les factures seront créées en statut <strong>Brouillon</strong>. Vous pourrez les marquer comme envoyées et payées depuis la liste des factures. Si des factures brouillon existent déjà pour ce mois, elles seront remplacées.
                </p>
                <form action={genererFacturesMois}>
                  <input type="hidden" name="mois" value={mois} />
                  <input type="hidden" name="annee" value={annee} />
                  <button
                    type="submit"
                    className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
                  >
                    ⚡ Générer les {previews?.length ?? 0} facture{(previews?.length ?? 0) > 1 ? 's' : ''} → {formatEuros(totalFacture)}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
