import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatEuros, formatDate, formatMoisAnnee, getMoisCourant } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord — AssistantMat',
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { mois, annee } = getMoisCourant();

  // Récupérer le profil
  const { data: assistante } = await supabase
    .from('assistantes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Compter les enfants actifs
  const { count: nbEnfants } = await supabase
    .from('enfants')
    .select('*', { count: 'exact', head: true })
    .eq('assistante_id', assistante?.id ?? '')
    .is('archived_at', null);

  // Factures du mois
  const { data: factures } = await supabase
    .from('factures')
    .select('*, enfants(prenom, nom)')
    .eq('assistante_id', assistante?.id ?? '')
    .eq('mois', mois)
    .eq('annee', annee);

  // Présences aujourd'hui
  const today = new Date().toISOString().split('T')[0];
  const { data: presencesToday } = await supabase
    .from('presences')
    .select('*, enfants(prenom)')
    .eq('assistante_id', assistante?.id ?? '')
    .eq('date', today)
    .eq('type', 'presence');

  const totalFactureMois = (factures ?? []).reduce((sum, f) => sum + (f.total_facture ?? 0), 0);
  const facturesPayees = (factures ?? []).filter((f) => f.statut === 'payee');
  const facturesEnAttente = (factures ?? []).filter((f) => f.statut !== 'payee' && f.statut !== 'annulee');

  const moisLabel = formatMoisAnnee(mois, annee);
  const isWelcome = params.welcome === '1';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        {isWelcome && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-medium">Bienvenue sur AssistantMat !</p>
              <p className="text-sm text-green-700">Commencez par ajouter votre premier enfant pour créer votre premier contrat.</p>
            </div>
          </div>
        )}
        <h1 className="text-2xl font-bold text-slate-900">
          Bonjour {assistante?.prenom ?? ''} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          {formatDate(new Date(), 'EEEE d MMMM yyyy')} · {moisLabel}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            emoji: '👶',
            label: 'Enfants accueillis',
            value: nbEnfants ?? 0,
            unit: `/ ${assistante?.capacite_accueil ?? 4} agréés`,
            color: 'bg-blue-50 text-blue-700',
          },
          {
            emoji: '✅',
            label: 'Présences ce jour',
            value: presencesToday?.length ?? 0,
            unit: 'enfant(s)',
            color: 'bg-green-50 text-green-700',
          },
          {
            emoji: '💶',
            label: `Facturé en ${moisLabel}`,
            value: formatEuros(totalFactureMois),
            unit: `${factures?.length ?? 0} facture(s)`,
            color: 'bg-violet-50 text-violet-700',
          },
          {
            emoji: '⏳',
            label: 'En attente de paiement',
            value: formatEuros(facturesEnAttente.reduce((s, f) => s + (f.total_facture ?? 0), 0)),
            unit: `${facturesEnAttente.length} facture(s)`,
            color: 'bg-amber-50 text-amber-700',
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className={`inline-flex items-center gap-2 ${kpi.color} px-2 py-1 rounded-lg text-xs font-medium mb-3`}>
              <span>{kpi.emoji}</span>
              <span>{kpi.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="text-xs text-slate-500 mt-1">{kpi.unit}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Présences aujourd'hui */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Présences aujourd&apos;hui</h2>
            <a href="/presences" className="text-xs text-violet-600 hover:underline">Voir tout →</a>
          </div>
          {!presencesToday || presencesToday.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">Aucune présence enregistrée aujourd&apos;hui.</p>
              <a href="/presences" className="text-violet-600 text-sm font-medium hover:underline mt-2 block">
                Ajouter une présence →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {presencesToday.map((p: { id: string; heure_debut?: string; heure_fin?: string; enfants: { prenom: string }[] | null }) => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                    👶
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{p.enfants?.[0]?.prenom ?? '—'}</p>
                    <p className="text-xs text-slate-500">
                      {p.heure_debut && p.heure_fin
                        ? `${p.heure_debut} → ${p.heure_fin}`
                        : 'Journée complète'}
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-lg">
                    Présent
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Factures du mois */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Factures — {moisLabel}</h2>
            <a href="/factures" className="text-xs text-violet-600 hover:underline">Gérer →</a>
          </div>
          {!factures || factures.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm">Aucune facture ce mois.</p>
              <a href="/factures" className="text-violet-600 text-sm font-medium hover:underline mt-2 block">
                Générer les factures →
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {factures.map((f: {
                id: string;
                total_facture: number;
                statut: string;
                enfants: { prenom: string; nom: string }[] | null;
              }) => (
                <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">
                      {f.enfants?.[0]?.prenom} {f.enfants?.[0]?.nom}
                    </p>
                    <p className="text-xs text-slate-500">{formatEuros(f.total_facture)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                    f.statut === 'payee'
                      ? 'bg-green-50 text-green-600'
                      : f.statut === 'envoyee'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {f.statut === 'payee' ? '✓ Payée' : f.statut === 'envoyee' ? '⏳ Envoyée' : 'Brouillon'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Empty state si pas de données */}
      {(nbEnfants ?? 0) === 0 && (
        <div className="mt-8 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl border border-violet-100 p-8 text-center">
          <div className="text-5xl mb-4">🧸</div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">Commencez par ajouter un enfant</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Une fois votre premier enfant ajouté, vous pourrez créer son contrat, enregistrer ses présences et générer ses factures.
          </p>
          <a
            href="/enfants/nouveau"
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Ajouter mon premier enfant →
          </a>
        </div>
      )}
    </div>
  );
}
