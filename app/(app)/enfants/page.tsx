import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatAge, formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mes enfants — AssistantMat' };

export default async function EnfantsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: assistante } = await supabase
    .from('assistantes').select('id').eq('user_id', user.id).single();

  const { data: enfants } = await supabase
    .from('enfants')
    .select('*, contrats(id, statut, tarif_horaire, heures_semaine, cmg_niveau, date_debut)')
    .eq('assistante_id', assistante?.id ?? '')
    .is('archived_at', null)
    .order('prenom');

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mes enfants</h1>
          <p className="text-slate-500 mt-1">
            {enfants?.length ?? 0} enfant(s) accueilli(s)
          </p>
        </div>
        <Link
          href="/enfants/nouveau"
          className="bg-violet-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
        >
          + Ajouter un enfant
        </Link>
      </div>

      {!enfants || enfants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="text-5xl mb-4">👶</div>
          <h2 className="font-semibold text-slate-900 text-lg mb-2">Aucun enfant pour le moment</h2>
          <p className="text-slate-500 text-sm mb-6">
            Ajoutez votre premier enfant pour commencer à gérer ses présences et factures.
          </p>
          <Link
            href="/enfants/nouveau"
            className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors"
          >
            Ajouter mon premier enfant →
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {enfants.map((enfant: {
            id: string;
            prenom: string;
            nom: string;
            date_naissance: string;
            parent1_prenom: string;
            parent1_nom: string;
            parent1_email?: string;
            contrats?: { id: string; statut: string; tarif_horaire: number; heures_semaine: number; cmg_niveau: number; date_debut: string }[];
          }) => {
            const contratActif = enfant.contrats?.find((c) => c.statut === 'actif');
            return (
              <Link key={enfant.id} href={`/enfants/${enfant.id}`}>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-violet-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                        👶
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          {enfant.prenom} {enfant.nom}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatAge(enfant.date_naissance)} · né(e) le {formatDate(enfant.date_naissance, 'dd/MM/yyyy')}
                        </p>
                      </div>
                    </div>
                    {contratActif ? (
                      <span className="text-xs bg-green-50 text-green-600 font-medium px-2 py-1 rounded-lg">
                        ✓ Actif
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-50 text-amber-600 font-medium px-2 py-1 rounded-lg">
                        Sans contrat
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-slate-500">
                    <div className="flex justify-between">
                      <span>Parents</span>
                      <span className="font-medium text-slate-700">
                        {enfant.parent1_prenom} {enfant.parent1_nom}
                      </span>
                    </div>
                    {contratActif && (
                      <>
                        <div className="flex justify-between">
                          <span>Tarif horaire</span>
                          <span className="font-medium text-slate-700">
                            {contratActif.tarif_horaire.toFixed(2)} €/h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Heures / semaine</span>
                          <span className="font-medium text-slate-700">
                            {contratActif.heures_semaine}h
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>CMG</span>
                          <span className="font-medium text-slate-700">
                            {contratActif.cmg_niveau === 0 ? 'Non' : `Niveau ${contratActif.cmg_niveau}`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
