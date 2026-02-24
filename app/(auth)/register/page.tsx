'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    password: '',
    numero_agrement: '',
    ville: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();

    // 1. Créer le compte auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError || !authData.user) {
      setError(authError?.message ?? 'Erreur lors de la création du compte.');
      setLoading(false);
      return;
    }

    // 2. Créer le profil assistante
    const { error: profileError } = await supabase.from('assistantes').insert({
      user_id: authData.user.id,
      prenom: formData.prenom,
      nom: formData.nom,
      email: formData.email,
      numero_agrement: formData.numero_agrement || null,
      ville: formData.ville || null,
    });

    if (profileError) {
      setError("Compte créé mais erreur lors de l'enregistrement du profil. Contactez le support.");
      setLoading(false);
      return;
    }

    router.push('/dashboard?welcome=1');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-3xl">🧸</span>
            <span className="font-bold text-slate-900 text-xl">AssistantMat</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Créer mon compte</h1>
          <p className="text-slate-500 mt-2">Gratuit · Sans carte bancaire · 3 enfants inclus</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium text-slate-700 mb-2">
                  Prénom *
                </label>
                <input
                  id="prenom" name="prenom" type="text"
                  value={formData.prenom} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Marie"
                />
              </div>
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-slate-700 mb-2">
                  Nom *
                </label>
                <input
                  id="nom" name="nom" type="text"
                  value={formData.nom} onChange={handleChange} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                  placeholder="Dupont"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email *
              </label>
              <input
                id="email" name="email" type="email"
                value={formData.email} onChange={handleChange} required
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="marie.dupont@exemple.fr"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe *
              </label>
              <input
                id="password" name="password" type="password"
                value={formData.password} onChange={handleChange} required minLength={8}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="8 caractères minimum"
              />
            </div>

            <div>
              <label htmlFor="numero_agrement" className="block text-sm font-medium text-slate-700 mb-2">
                Numéro d&apos;agrément <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                id="numero_agrement" name="numero_agrement" type="text"
                value={formData.numero_agrement} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="N° agrément PMI"
              />
            </div>

            <div>
              <label htmlFor="ville" className="block text-sm font-medium text-slate-700 mb-2">
                Ville <span className="text-slate-400">(optionnel)</span>
              </label>
              <input
                id="ville" name="ville" type="text"
                value={formData.ville} onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="Lyon"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 text-white py-3 rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte gratuit →'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-violet-600 font-medium hover:underline">
              Se connecter
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4 leading-relaxed">
            En créant un compte, vous acceptez nos CGU et notre politique de confidentialité.
          </p>
        </div>
      </div>
    </div>
  );
}
