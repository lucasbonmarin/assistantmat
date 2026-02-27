'use client';

import { useState, useTransition, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loguerPresence } from '@/lib/actions/presences';
import { createClient } from '@/lib/supabase/client';

interface Enfant {
  id: string;
  prenom: string;
  nom: string;
}

const TYPE_PRESENCE = [
  { value: 'presence', label: 'Présence', emoji: '✅', color: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'absence_payee', label: 'Absence payée', emoji: '💛', color: 'border-amber-200 bg-amber-50 text-amber-700' },
  { value: 'absence_non_payee', label: 'Absence non payée', emoji: '⛔', color: 'border-red-200 bg-red-50 text-red-700' },
  { value: 'conge_am', label: 'Congé AM', emoji: '🏖️', color: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'jf_non_travaille', label: 'Jour férié', emoji: '🏛️', color: 'border-slate-200 bg-slate-50 text-slate-600' },
  { value: 'fermeture', label: 'Fermeture', emoji: '🔒', color: 'border-slate-200 bg-slate-50 text-slate-600' },
];

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function NouvellePresenceForm() {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [enfants, setEnfants] = useState<Enfant[]>([]);
  const [typeSelectionne, setTypeSelectionne] = useState('presence');
  const [avecHeures, setAvecHeures] = useState(true);
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('17:00');

  const dateParam = searchParams.get('date') ?? getTodayDate();
  const enfantIdParam = searchParams.get('enfant_id') ?? '';

  // Fetch des enfants
  useEffect(() => {
    const fetchEnfants = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assistante } = await supabase
        .from('assistantes').select('id').eq('user_id', user.id).single();
      if (!assistante) return;

      const { data } = await supabase
        .from('enfants')
        .select('id, prenom, nom')
        .eq('assistante_id', assistante.id)
        .is('archived_at', null)
        .order('prenom');

      setEnfants(data ?? []);
    };

    fetchEnfants();
  }, []);

  // Durée calculée
  const dureeHeures = (() => {
    if (!avecHeures || !heureDebut || !heureFin) return null;
    const [h1, m1] = heureDebut.split(':').map(Number);
    const [h2, m2] = heureFin.split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff <= 0) return null;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
  })();

  const isPresenceActive = typeSelectionne === 'presence';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('type', typeSelectionne);
    if (!avecHeures || !isPresenceActive) {
      formData.delete('heure_debut');
      formData.delete('heure_fin');
    }

    startTransition(async () => {
      const result = await loguerPresence(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/presences" className="hover:text-slate-800 transition-colors">Présences</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">Enregistrer une présence</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Nouvelle présence</h1>
      <p className="text-slate-500 text-sm mb-8">Enregistrez une journée de garde.</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          {/* Enfant */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Enfant <span className="text-red-500">*</span>
            </label>
            {enfants.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
                Aucun enfant trouvé.{' '}
                <Link href="/enfants/nouveau" className="underline">Ajoutez un enfant</Link> d'abord.
              </div>
            ) : (
              <select
                name="enfant_id"
                required
                defaultValue={enfantIdParam}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              >
                <option value="">— Sélectionner un enfant —</option>
                {enfants.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              name="date"
              type="date"
              required
              defaultValue={dateParam}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          {/* Type de présence */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_PRESENCE.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setTypeSelectionne(t.value);
                    if (t.value !== 'presence') setAvecHeures(false);
                    else setAvecHeures(true);
                  }}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    typeSelectionne === t.value
                      ? t.color + ' ring-2 ring-offset-1 ring-violet-400'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 bg-white'
                  }`}
                >
                  <span>{t.emoji}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Heures (seulement pour présence/absence payée) */}
          {(typeSelectionne === 'presence' || typeSelectionne === 'absence_payee') && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-slate-700">Horaires</label>
                <button
                  type="button"
                  onClick={() => setAvecHeures(!avecHeures)}
                  className="text-xs text-violet-600 hover:underline"
                >
                  {avecHeures ? 'Sans horaires précis' : 'Ajouter les horaires'}
                </button>
              </div>

              {avecHeures && (
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Arrivée</label>
                    <input
                      name="heure_debut"
                      type="time"
                      value={heureDebut}
                      onChange={(e) => setHeureDebut(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  <span className="text-slate-400 text-sm mt-4">→</span>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Départ</label>
                    <input
                      name="heure_fin"
                      type="time"
                      value={heureFin}
                      onChange={(e) => setHeureFin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                  {dureeHeures && (
                    <div className="mt-4">
                      <div className="bg-violet-50 text-violet-700 px-3 py-2 rounded-xl text-sm font-medium">
                        {dureeHeures}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Repas */}
          {typeSelectionne === 'presence' && (
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="repas"
                  value="true"
                  className="w-4 h-4 rounded text-violet-600"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">🍽️ Repas fourni</span>
                  <p className="text-xs text-slate-400 mt-0.5">Coché si vous avez fourni le repas de midi</p>
                </div>
              </label>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="Informations particulières sur cette journée..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <Link
            href="/presences"
            className="text-slate-500 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors"
          >
            ← Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending || enfants.length === 0}
            className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              '✓ Enregistrer la présence'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NouvellePresencePage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Chargement...</div>}>
      <NouvellePresenceForm />
    </Suspense>
  );
}
