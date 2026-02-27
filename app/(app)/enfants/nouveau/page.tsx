'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ajouterEnfant } from '@/lib/actions/enfants';
import type { Metadata } from 'next';

const JOURS = [
  { id: 'lundi', label: 'Lun' },
  { id: 'mardi', label: 'Mar' },
  { id: 'mercredi', label: 'Mer' },
  { id: 'jeudi', label: 'Jeu' },
  { id: 'vendredi', label: 'Ven' },
];

const STEPS = [
  { id: 1, label: 'Enfant', emoji: '👶' },
  { id: 2, label: 'Parents', emoji: '👨‍👩‍👧' },
  { id: 3, label: 'Contrat', emoji: '📄' },
];

export default function NouvelEnfantPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [creerContrat, setCreerContrat] = useState(true);
  const [joursSelectionnes, setJoursSelectionnes] = useState<string[]>(['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']);

  function toggleJour(jour: string) {
    setJoursSelectionnes((prev) =>
      prev.includes(jour) ? prev.filter((j) => j !== jour) : [...prev, jour]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set('creer_contrat', String(creerContrat));
    formData.set('jours_semaine', joursSelectionnes.join(','));

    startTransition(async () => {
      const result = await ajouterEnfant(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/enfants" className="hover:text-slate-800 transition-colors">Mes enfants</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">Ajouter un enfant</span>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Nouvel enfant</h1>
      <p className="text-slate-500 text-sm mb-8">Renseignez les informations de l'enfant et de ses parents.</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { if (s.id < step) setStep(s.id); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === s.id
                  ? 'bg-violet-100 text-violet-700'
                  : s.id < step
                  ? 'bg-green-50 text-green-700 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >
              {s.id < step ? '✓' : s.emoji} {s.label}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-6 ${step > s.id ? 'bg-green-200' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm mb-6">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Enfant */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span>👶</span> Informations de l'enfant
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <input
                  name="prenom"
                  type="text"
                  required
                  placeholder="Emma"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  name="nom"
                  type="text"
                  required
                  placeholder="Dupont"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date de naissance <span className="text-red-500">*</span>
              </label>
              <input
                name="date_naissance"
                type="date"
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-400 mt-1">
                L'âge détermine le plafond CMG applicable (différent avant/après 3 ans).
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Parents */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span>👨‍👩‍👧</span> Informations des parents
            </h2>

            <div className="border-b border-slate-100 pb-5 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent 1 (employeur principal)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="parent1_prenom"
                    type="text"
                    required
                    placeholder="Sophie"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="parent1_nom"
                    type="text"
                    required
                    placeholder="Dupont"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    name="parent1_email"
                    type="email"
                    placeholder="sophie@email.fr"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                  <input
                    name="parent1_tel"
                    type="tel"
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Parent 2 (optionnel)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    name="parent2_prenom"
                    type="text"
                    placeholder="Marc"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    name="parent2_nom"
                    type="text"
                    placeholder="Dupont"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  N° allocataire CAF
                  <span className="ml-1 text-xs text-slate-400 font-normal">(pour le CMG)</span>
                </label>
                <input
                  name="allocataire_caf"
                  type="text"
                  placeholder="1234567A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-slate-500 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm"
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contrat */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <span>📄</span> Contrat de garde
            </h2>

            {/* Toggle créer contrat */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-slate-800">Créer un contrat maintenant</p>
                <p className="text-xs text-slate-500 mt-0.5">Vous pourrez le créer plus tard si besoin.</p>
              </div>
              <button
                type="button"
                onClick={() => setCreerContrat(!creerContrat)}
                className={`w-11 h-6 rounded-full transition-colors ${creerContrat ? 'bg-violet-600' : 'bg-slate-300'}`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${creerContrat ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {creerContrat && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date de début</label>
                  <input
                    name="date_debut_contrat"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tarif horaire (€/h) <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="tarif_horaire"
                      type="number"
                      step="0.01"
                      min="3.90"
                      placeholder="4.50"
                      required={creerContrat}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Minimum légal : 3,90 €/h (2025)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Heures / semaine <span className="text-red-500">*</span>
                    </label>
                    <input
                      name="heures_semaine"
                      type="number"
                      step="0.5"
                      min="1"
                      max="50"
                      placeholder="45"
                      required={creerContrat}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Jours de garde</label>
                  <div className="flex gap-2">
                    {JOURS.map((jour) => (
                      <button
                        key={jour.id}
                        type="button"
                        onClick={() => toggleJour(jour.id)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          joursSelectionnes.includes(jour.id)
                            ? 'bg-violet-100 text-violet-700 border border-violet-200'
                            : 'bg-slate-100 text-slate-500 border border-transparent hover:bg-slate-200'
                        }`}
                      >
                        {jour.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Indemnité d'entretien (€/jour)
                    </label>
                    <input
                      name="tarif_entretien"
                      type="number"
                      step="0.10"
                      min="3.30"
                      placeholder="3.30"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Minimum : 3,30 €/jour (2025)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Semaines travaillées / an
                    </label>
                    <input
                      name="semaines_annee"
                      type="number"
                      min="40"
                      max="52"
                      placeholder="47"
                      defaultValue="47"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <p className="text-xs text-slate-400 mt-1">Standard PAJEMPLOI : 47 sem.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Niveau CMG (CAF)</label>
                  <select
                    name="cmg_niveau"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  >
                    <option value="0">Pas de CMG</option>
                    <option value="1">Niveau 1 — Ressources modestes (≤ 1 248 €/mois)</option>
                    <option value="2">Niveau 2 — Ressources moyennes (≤ 2 496 €/mois)</option>
                    <option value="3">Niveau 3 — Ressources élevées (≤ 4 993 €/mois)</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    Le CMG est une aide CAF qui réduit le coût pour la famille. Niveaux basés sur les ressources nettes fiscales du ménage.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="repas_inclus"
                      value="true"
                      className="w-4 h-4 rounded text-violet-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Repas fournis (facturation séparée)</span>
                  </label>
                  <div className="mt-2 ml-6">
                    <input
                      name="tarif_repas"
                      type="number"
                      step="0.10"
                      min="0"
                      placeholder="3.50"
                      defaultValue="3.50"
                      className="w-32 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <span className="text-xs text-slate-400 ml-2">€ / repas</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    name="notes_contrat"
                    rows={2}
                    placeholder="Informations complémentaires sur le contrat..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-slate-500 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-100 transition-colors"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="bg-violet-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-violet-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPending ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  '✓ Enregistrer'
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
