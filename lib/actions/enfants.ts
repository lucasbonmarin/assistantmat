'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { NiveauCMG } from '@/lib/calculations/cmg';

export interface AjouterEnfantFormData {
  // Enfant
  prenom: string;
  nom: string;
  date_naissance: string;
  // Parent 1
  parent1_prenom: string;
  parent1_nom: string;
  parent1_email: string;
  parent1_tel: string;
  // Parent 2 (optionnel)
  parent2_prenom?: string;
  parent2_nom?: string;
  parent2_email?: string;
  parent2_tel?: string;
  allocataire_caf?: string;
  // Contrat (optionnel)
  creer_contrat: boolean;
  tarif_horaire?: number;
  heures_semaine?: number;
  jours_semaine?: string[];
  semaines_annee?: number;
  tarif_entretien?: number;
  repas_inclus?: boolean;
  tarif_repas?: number;
  cmg_niveau?: NiveauCMG;
  date_debut_contrat?: string;
  notes_contrat?: string;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
  enfantId?: string;
}

export async function ajouterEnfant(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  // Récupérer l'assistante
  const { data: assistante, error: amErr } = await supabase
    .from('assistantes')
    .select('id, capacite_accueil, tarif_horaire_defaut, tarif_entretien_defaut')
    .eq('user_id', user.id)
    .single();

  if (amErr || !assistante) {
    return { error: 'Profil assistante introuvable. Veuillez compléter votre inscription.' };
  }

  // Valider les champs obligatoires
  const prenom = formData.get('prenom') as string;
  const nom = formData.get('nom') as string;
  const date_naissance = formData.get('date_naissance') as string;
  const parent1_prenom = formData.get('parent1_prenom') as string;
  const parent1_nom = formData.get('parent1_nom') as string;
  const parent1_email = formData.get('parent1_email') as string;

  if (!prenom || !nom || !date_naissance || !parent1_prenom || !parent1_nom) {
    return { error: 'Veuillez remplir tous les champs obligatoires.' };
  }

  // Insérer l'enfant
  const { data: enfant, error: enfantErr } = await supabase
    .from('enfants')
    .insert({
      assistante_id: assistante.id,
      prenom: prenom.trim(),
      nom: nom.trim(),
      date_naissance,
      parent1_prenom: parent1_prenom.trim(),
      parent1_nom: parent1_nom.trim(),
      parent1_email: (formData.get('parent1_email') as string)?.trim() || null,
      parent1_tel: (formData.get('parent1_tel') as string)?.trim() || null,
      parent2_prenom: (formData.get('parent2_prenom') as string)?.trim() || null,
      parent2_nom: (formData.get('parent2_nom') as string)?.trim() || null,
      parent2_email: (formData.get('parent2_email') as string)?.trim() || null,
      parent2_tel: (formData.get('parent2_tel') as string)?.trim() || null,
      allocataire_caf: (formData.get('allocataire_caf') as string)?.trim() || null,
    })
    .select('id')
    .single();

  if (enfantErr || !enfant) {
    return { error: `Erreur lors de la création de l'enfant : ${enfantErr?.message}` };
  }

  // Créer le contrat si demandé
  const creerContrat = formData.get('creer_contrat') === 'true';
  if (creerContrat) {
    const tarif_horaire = parseFloat(formData.get('tarif_horaire') as string);
    const heures_semaine = parseFloat(formData.get('heures_semaine') as string);
    const date_debut = formData.get('date_debut_contrat') as string || new Date().toISOString().split('T')[0];

    if (!isNaN(tarif_horaire) && !isNaN(heures_semaine)) {
      const joursStr = formData.get('jours_semaine') as string;
      const jours_semaine = joursStr ? joursStr.split(',').filter(Boolean) : [];
      const cmg_niveau = parseInt(formData.get('cmg_niveau') as string || '0') as NiveauCMG;
      const tarif_entretien = parseFloat(formData.get('tarif_entretien') as string) || assistante.tarif_entretien_defaut;
      const tarif_repas = parseFloat(formData.get('tarif_repas') as string) || 3.5;
      const repas_inclus = formData.get('repas_inclus') === 'true';
      const semaines_annee = parseInt(formData.get('semaines_annee') as string || '47');

      await supabase.from('contrats').insert({
        enfant_id: enfant.id,
        assistante_id: assistante.id,
        date_debut,
        heures_semaine,
        jours_semaine,
        semaines_annee,
        tarif_horaire,
        tarif_entretien,
        repas_inclus,
        tarif_repas,
        cmg_niveau,
        statut: 'actif',
        notes: (formData.get('notes_contrat') as string)?.trim() || null,
      });
    }
  }

  redirect(`/enfants/${enfant.id}`);
}
