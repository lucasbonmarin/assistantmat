'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function loguerPresence(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: assistante } = await supabase
    .from('assistantes').select('id').eq('user_id', user.id).single();
  if (!assistante) return { error: 'Profil assistante introuvable.' };

  const enfant_id = formData.get('enfant_id') as string;
  const date = formData.get('date') as string;
  const type = formData.get('type') as string;

  if (!enfant_id || !date || !type) {
    return { error: 'Enfant, date et type sont obligatoires.' };
  }

  // Récupérer le contrat actif pour cet enfant
  const { data: contrat } = await supabase
    .from('contrats')
    .select('id')
    .eq('enfant_id', enfant_id)
    .eq('assistante_id', assistante.id)
    .eq('statut', 'actif')
    .single();

  if (!contrat) {
    return { error: "Aucun contrat actif trouvé pour cet enfant. Veuillez d'abord créer un contrat." };
  }

  const heure_debut = (formData.get('heure_debut') as string)?.trim() || null;
  const heure_fin = (formData.get('heure_fin') as string)?.trim() || null;
  const repas = formData.get('repas') === 'true';
  const notes = (formData.get('notes') as string)?.trim() || null;

  const { error } = await supabase.from('presences').insert({
    enfant_id,
    contrat_id: contrat.id,
    assistante_id: assistante.id,
    date,
    type,
    heure_debut,
    heure_fin,
    repas,
    notes,
  });

  if (error) {
    // Contrainte unique date+enfant+type
    if (error.code === '23505') {
      return { error: 'Une présence de ce type existe déjà pour cet enfant à cette date.' };
    }
    return { error: `Erreur : ${error.message}` };
  }

  redirect('/presences');
}
