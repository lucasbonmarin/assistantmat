import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatEuros, formatMoisAnnee, getMoisCourant } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Factures — AssistantMat' };

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; annee?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assistante } = await supabase
    .from('assistantes').select('id').eq('user_id', user.id).single();

  const { mois: moisCourant, annee: anneeCourante } = getMoisCourant();
  const mois = params.mois ? parseInt(params.mois) : moisCourant;
  const annee = params.annee ? parseInt(params.annee) : anneeCourante;

  const { data: factures } = await supabase
    .from('factures')
    .select('*, enfants(prenom, nom)')
    .eq('assistante_id', assistante?.id ?? '')
    .eq('mois', mois)
    .eq('annee', annee)
    .order('created_at');

  const totalMois = (factures ?? []).reduce((s, f) => s + (f.total_facture ?? 0), 0);
  const totalCmg = (factures ?? []).reduce((s, f) => s + (f.cmg_montant ?? 0), 0);
  const totalNetAm = (factures ?? []).reduce((s, f) => s + (f.salaire_net ?? 0), 0);

  const moisLabel = formatMoisAnnee(mois, annee);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Factures</h1>
          <p className="text-slate-500 mt-1">{moisLabel}</p>
        </div>
        <div className="flex gap-3">
          <a
            href={`/api/export/pajemploi?mois=${mois}&annee=${annee}`}
            className="border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:border-slate-300 transition-colors"
          >
            📤 Export PAJEMPLOI
          </a>
          <Link
            href="/factures/generer"
            className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
          >
            ⚡ Générer les factures
          </Link>
        </div>
      </div>

      {/* Résumé du mois */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total facturé', value: formatEuros(totalMois), emoji: '💶', note: 'Coût total parents' },
          { label: 'Aide CMG CAF', value: formatEuros(totalCmg), emoji: '🏦', note: 'Déduit automatiquement' },
          { label: 'Votre net AM', value: formatEuros(totalNetAm), emoji: '✅', note: 'Salaire net perçu' },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-2">
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{item.value}</div>
            <div className="text-xs text-slate-400 mt-1">{item.note}</div>
          </div>
        ))}
      </div>

      {/* Liste des factures */}
      {!factures || factures.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">💶</div>
          <h2 className="font-semibold text-slate-900 text-lg mb-2">
            Aucune facture pour {moisLabel}
          </h2>
          <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
            Générez les factures mensuelles pour tous vos enfants en un seul clic.
            AssistantMat calcule automatiquement les cotisations et déduit le CMG.
          </p>
          <Link
            href="/factures/generer"
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Générer les factures de {moisLabel} →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-3 font-medium text-slate-600">Enfant</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Heures</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Salaire brut</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">CMG déduit</th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">Net AM</th>
                <th className="text-right px-6 py-3 font-medium text-slate-600">Total famille</th>
                <th className="px-4 py-3 font-medium text-slate-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {factures.map((f: {
                id: string;
                heures_facturees: number;
                salaire_brut: number;
                cmg_montant: number;
                salaire_net: number;
                total_facture: number;
                statut: string;
                enfants: { prenom: string; nom: string }[] | null;
              }) => (
                <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {f.enfants?.[0]?.prenom} {f.enfants?.[0]?.nom}
                  </td>
                  <td className="text-right px-4 py-4 text-slate-600">
                    {f.heures_facturees.toFixed(1)}h
                  </td>
                  <td className="text-right px-4 py-4 text-slate-600">
                    {formatEuros(f.salaire_brut)}
                  </td>
                  <td className="text-right px-4 py-4 text-green-600 font-medium">
                    {f.cmg_montant > 0 ? `− ${formatEuros(f.cmg_montant)}` : '—'}
                  </td>
                  <td className="text-right px-4 py-4 text-slate-800 font-medium">
                    {formatEuros(f.salaire_net)}
                  </td>
                  <td className="text-right px-6 py-4 font-bold text-violet-600">
                    {formatEuros(f.total_facture)}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      f.statut === 'payee'
                        ? 'bg-green-50 text-green-600'
                        : f.statut === 'envoyee'
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {f.statut === 'payee' ? '✓ Payée' : f.statut === 'envoyee' ? 'Envoyée' : 'Brouillon'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={5} className="px-6 py-3 font-semibold text-slate-700">
                  Total {moisLabel}
                </td>
                <td className="text-right px-6 py-3 font-bold text-violet-600 text-lg">
                  {formatEuros(totalMois)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
