/**
 * AssistantMat — Types Supabase auto-générés (version manuelle MVP)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type StatutContrat = 'brouillon' | 'actif' | 'suspendu' | 'termine';
export type StatutFacture = 'brouillon' | 'envoyee' | 'payee' | 'annulee';
export type TypePresence = 'presence' | 'absence_payee' | 'absence_non_payee' | 'conge_am' | 'jf_non_travaille' | 'fermeture';

export interface Assistante {
  id: string;
  user_id: string;
  prenom: string;
  nom: string;
  email: string;
  telephone?: string;
  siret?: string;
  numero_agrement?: string;
  adresse?: string;
  code_postal?: string;
  ville?: string;
  capacite_accueil: number;
  tarif_horaire_defaut: number;
  tarif_entretien_defaut: number;
  created_at: string;
}

export interface Enfant {
  id: string;
  assistante_id: string;
  prenom: string;
  nom: string;
  date_naissance: string;  // ISO date
  parent1_prenom: string;
  parent1_nom: string;
  parent1_email?: string;
  parent1_tel?: string;
  parent2_prenom?: string;
  parent2_nom?: string;
  parent2_email?: string;
  parent2_tel?: string;
  allocataire_caf?: string;
  created_at: string;
  archived_at?: string;
}

export interface Contrat {
  id: string;
  enfant_id: string;
  assistante_id: string;
  date_debut: string;  // ISO date
  date_fin?: string;
  heures_semaine: number;
  jours_semaine: string[];
  semaines_annee: number;
  tarif_horaire: number;
  tarif_entretien: number;
  repas_inclus: boolean;
  tarif_repas: number;
  cmg_niveau: 0 | 1 | 2 | 3;
  statut: StatutContrat;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Presence {
  id: string;
  enfant_id: string;
  contrat_id: string;
  assistante_id: string;
  date: string;  // ISO date
  type: TypePresence;
  heure_debut?: string;  // HH:MM
  heure_fin?: string;
  heures_realisees: number;  // Generated
  repas: boolean;
  notes?: string;
  created_at: string;
}

export interface Facture {
  id: string;
  enfant_id: string;
  contrat_id: string;
  assistante_id: string;
  mois: number;
  annee: number;
  heures_realisees: number;
  heures_contractuelles: number;
  heures_facturees: number;
  salaire_brut: number;
  cotisations_patronales: number;
  cotisations_salariales: number;
  salaire_net: number;
  cmg_montant: number;
  frais_entretien: number;
  frais_repas: number;
  total_charges_parent: number;
  total_facture: number;
  statut: StatutFacture;
  pajemploi_ref?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Relations (joins)
// ============================================================

export type EnfantAvecContrat = Enfant & {
  contrats?: Contrat[];
  contrat_actif?: Contrat;
};

export type FactureAvecDetails = Facture & {
  enfant?: Enfant;
  contrat?: Contrat;
};
