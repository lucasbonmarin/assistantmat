'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { calculerFacture, ageEnMois } from '@/lib/calculations/cmg';
import type { NiveauCMG } from '@/lib/calculations/cmg';

export interface FactureGenereePreview {
  enfant_id: string;
  contrat_id: string;
  prenom: string;
  nom: string;
  heures_realisees: number;
  heures_contractuelles: number;
  jours_presences: number;
  repas: number;
  calcul: ReturnType<typeof calculerFacture>;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
  facturesGenerees?: number;
}

/**
 * Calcule les factures pour un mois donné (sans les insérer)
 * Utilisé pour la page de prévisualisation.
 */
export async function calculerFacturesMois(
  mois: number,
  annee: number
): Promise<{ error?: string; previews?: FactureGenereePreview[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: assistante } = await supabase
    .from('assistantes')
    .select('id, tarif_entretien_defaut')
    .eq('user_id', user.id)
    .single();
  if (!assistante) return { error: 'Profil assistante introuvable.' };

  // Contrats actifs avec info enfant
  const { data: contrats, error: contratsErr } = await supabase
    .from('contrats')
    .select('*, enfants(id, prenom, nom, date_naissance)')
    .eq('assistante_id', assistante.id)
    .eq('statut', 'actif');

  if (contratsErr) return { error: contratsErr.message };
  if (!contrats || contrats.length === 0) {
    return { error: 'Aucun contrat actif. Ajoutez des enfants avec des contrats actifs.' };
  }

  // Dates du mois
  const debut = `${annee}-${String(mois).padStart(2, '0')}-01`;
  const fin = new Date(annee, mois, 0).toISOString().split('T')[0]; // Dernier jour du mois

  const previews: FactureGenereePreview[] = [];

  for (const contrat of contrats) {
    const enfant = contrat.enfants as { id: string; prenom: string; nom: string; date_naissance: string } | null;
    if (!enfant) continue;

    // Présences du mois pour ce contrat
    const { data: presences } = await supabase
      .from('presences')
      .select('type, heures_realisees, repas')
      .eq('contrat_id', contrat.id)
      .gte('date', debut)
      .lte('date', fin);

    // Calcul des heures et repas
    const heures_realisees = (presences ?? [])
      .filter((p) => p.type === 'presence' || p.type === 'absence_payee')
      .reduce((s, p) => s + (p.heures_realisees ?? 0), 0);

    const jours_presences = (presences ?? []).filter((p) => p.type === 'presence').length;
    const repas = (presences ?? []).filter((p) => p.repas).length;

    // Heures contractuelles du mois = heures_semaine × semaines_mois
    const semaines_mois = (contrat.heures_semaine * contrat.semaines_annee) / 12;
    const heures_contractuelles = Math.round(semaines_mois * 100) / 100;

    const age_mois = ageEnMois(new Date(enfant.date_naissance), new Date(annee, mois - 1, 15));

    const calcul = calculerFacture({
      heures_realisees: Math.round(heures_realisees * 100) / 100,
      heures_contractuelles,
      tarif_horaire: contrat.tarif_horaire,
      tarif_entretien: contrat.tarif_entretien || assistante.tarif_entretien_defaut,
      jours_presences,
      repas,
      tarif_repas: contrat.tarif_repas || 3.5,
      cmg_niveau: (contrat.cmg_niveau ?? 0) as NiveauCMG,
      age_enfant_mois: age_mois,
    });

    previews.push({
      enfant_id: enfant.id,
      contrat_id: contrat.id,
      prenom: enfant.prenom,
      nom: enfant.nom,
      heures_realisees: Math.round(heures_realisees * 100) / 100,
      heures_contractuelles,
      jours_presences,
      repas,
      calcul,
    });
  }

  return { previews };
}

/**
 * Insère les factures en base pour le mois donné.
 * Compatible avec la directive form action (retourne void via redirect ou throw).
 */
export async function genererFacturesMois(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: assistante } = await supabase
    .from('assistantes')
    .select('id, tarif_entretien_defaut')
    .eq('user_id', user.id)
    .single();
  if (!assistante) throw new Error('Profil assistante introuvable.');

  const mois = parseInt(formData.get('mois') as string);
  const annee = parseInt(formData.get('annee') as string);

  if (isNaN(mois) || isNaN(annee)) throw new Error('Mois/année invalides.');

  // Supprimer les factures brouillon existantes pour ce mois (régénération)
  await supabase
    .from('factures')
    .delete()
    .eq('assistante_id', assistante.id)
    .eq('mois', mois)
    .eq('annee', annee)
    .eq('statut', 'brouillon');

  const { previews, error } = await calculerFacturesMois(mois, annee);
  if (error) throw new Error(error);
  if (!previews || previews.length === 0) throw new Error('Aucune facture à générer.');

  // Insérer toutes les factures
  const insertions = previews.map((p) => ({
    enfant_id: p.enfant_id,
    contrat_id: p.contrat_id,
    assistante_id: assistante.id,
    mois,
    annee,
    heures_realisees: p.heures_realisees,
    heures_contractuelles: p.heures_contractuelles,
    heures_facturees: p.calcul.heures_facturees,
    salaire_brut: p.calcul.salaire_brut,
    cotisations_patronales: p.calcul.cotisations_patronales,
    cotisations_salariales: p.calcul.cotisations_salariales,
    salaire_net: p.calcul.salaire_net,
    cmg_montant: p.calcul.cmg_montant,
    frais_entretien: p.calcul.frais_entretien,
    frais_repas: p.calcul.frais_repas,
    total_charges_parent: p.calcul.total_charges_parent,
    total_facture: p.calcul.total_facture,
    statut: 'brouillon',
  }));

  const { error: insertErr } = await supabase.from('factures').insert(insertions);

  if (insertErr) throw new Error(`Erreur insertion : ${insertErr.message}`);

  redirect(`/factures?mois=${mois}&annee=${annee}`);
}
