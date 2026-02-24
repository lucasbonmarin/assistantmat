/**
 * AssistantMat — Moteur de calcul CMG & PAJEMPLOI
 * 
 * Sources légales:
 * - Barème PAJEMPLOI 2025 (service-public.fr)
 * - CMG (Complément de Mode de Garde) CAF 2025
 * - Convention collective nationale des assistants maternels du particulier employeur
 *
 * PAJEMPLOI = Pôle Emploi + Urssaf pour la garde d'enfants à domicile/AM
 * Le CMG est versé par la CAF directement à l'AM via PAJEMPLOI
 */

// =====================================================
// Taux de cotisations PAJEMPLOI (2025)
// =====================================================

export const TAUX_COTISATIONS = {
  // Charges patronales (payées par le parent employeur)
  patronales: {
    assurance_maladie_maternite: 0.0755,
    assurance_vieillesse_plafonnee: 0.0855,
    assurance_vieillesse_deplafonee: 0.0185,
    allocations_familiales: 0.0300,
    accidents_travail: 0.0240,        // Taux moyen pour les AM
    fnal: 0.0010,
    versement_mobilite: 0,            // 0 pour particuliers employeurs
    total: 0.3345,                    // ~33.45% du salaire brut
  },
  // Charges salariales (déduites du brut pour calculer le net)
  salariales: {
    assurance_maladie: 0.0075,
    assurance_vieillesse_plafonnee: 0.0690,
    assurance_vieillesse_deplafonee: 0.0040,
    chomage: 0.0240,
    retraite_complementaire: 0.0315,
    apec: 0,                          // Non applicable aux AM
    total: 0.1360,                    // ~13.6% du salaire brut
  },
} as const;

// Indemnité d'entretien minimale 2025 (net d'impôt, non soumise à cotisations)
export const ENTRETIEN_MIN_2025 = 3.30;  // €/jour

// Tarif horaire minimum légal 2025
export const TARIF_MIN_HORAIRE_2025 = 3.90; // €/heure brut

// =====================================================
// CMG (Complément de Mode de Garde) 2025
// =====================================================

/**
 * Niveaux de ressources pour le CMG (revenu net fiscal du ménage / 12)
 * Plafonds mensuels 2025 (valeurs indicatives, révisées chaque 1er avril)
 */
export const CMG_PLAFONDS_RESSOURCES = {
  niveau1: {  // Ressources ≤ 1 fois le plafond
    // Enfant < 3 ans
    moins3ans_max: 1248,       // €/mois ressources max
    // Enfant 3-6 ans
    entre3_6ans_max: 1248,
  },
  niveau2: {  // Plafond N1 < ressources ≤ 2× plafond
    moins3ans_max: 2496,
    entre3_6ans_max: 2496,
  },
  niveau3: {  // Plafond N2 < ressources ≤ 3× plafond
    moins3ans_max: 4993,
    entre3_6ans_max: 4993,
  },
  // Au-dessus de niveau3 : pas de CMG
} as const;

/**
 * Montants maximum CMG 2025 (prise en charge mensuelle maximale)
 * Le CMG couvre une partie du salaire net + 50% des cotisations
 */
export const CMG_MONTANTS_MAX_2025 = {
  moins3ans: {
    niveau1: 1066.79,   // €/mois max
    niveau2: 595.90,
    niveau3: 297.95,
  },
  entre3_6ans: {
    niveau1: 533.40,
    niveau2: 297.95,
    niveau3: 148.97,
  },
} as const;

// =====================================================
// Types
// =====================================================

export type NiveauCMG = 0 | 1 | 2 | 3;  // 0 = pas de CMG

export interface CalculFactureInput {
  heures_realisees: number;
  heures_contractuelles: number;   // Heures prévues au contrat ce mois
  tarif_horaire: number;            // €/heure brut
  tarif_entretien: number;          // €/jour
  jours_presences: number;          // Jours de présence ce mois
  repas: number;                    // Nombre de repas
  tarif_repas: number;              // €/repas
  cmg_niveau: NiveauCMG;
  age_enfant_mois: number;          // Âge en mois pour calculer le plafond CMG
}

export interface CalculFactureResult {
  // Heures
  heures_facturees: number;         // Max(réalisées, garanties = 87% des contractuelles)
  heures_garanties: number;         // 87% des heures contractuelles (mensualisation)
  
  // Salaire
  salaire_brut: number;
  
  // Cotisations
  cotisations_patronales: number;
  cotisations_salariales: number;
  salaire_net: number;
  
  // CMG
  cmg_montant: number;
  cmg_eligible: boolean;
  
  // Indemnités (non soumises à cotisations, non déduites du CMG)
  frais_entretien: number;
  frais_repas: number;
  
  // Totaux
  total_charges_parent: number;    // Net + patronales - CMG (le coût "salarial" pour le parent)
  total_facture: number;           // total_charges_parent + entretien + repas
  
  // Détail pour transparence
  detail: {
    mensualisation: boolean;
    heures_absences_deduites: number;
    cout_avant_cmg: number;
    taux_patronal: number;
    taux_salarial: number;
  };
}

// =====================================================
// Fonctions utilitaires
// =====================================================

/** Arrondi à 2 décimales */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Âge de l'enfant en mois à la date donnée */
export function ageEnMois(dateNaissance: Date, reference?: Date): number {
  const ref = reference ?? new Date();
  const diffMs = ref.getTime() - dateNaissance.getTime();
  const diffMois = diffMs / (1000 * 60 * 60 * 24 * 30.4375); // Mois moyens
  return Math.floor(diffMois);
}

/** Plafond CMG applicable selon l'âge */
function getMaxCmg(ageEnMois: number, niveau: NiveauCMG): number {
  if (niveau === 0) return 0;
  const tranche = ageEnMois < 36 ? 'moins3ans' : 'entre3_6ans';
  // Pas de CMG après 6 ans (72 mois)
  if (ageEnMois >= 72) return 0;
  const key = `niveau${niveau}` as 'niveau1' | 'niveau2' | 'niveau3';
  return CMG_MONTANTS_MAX_2025[tranche][key] ?? 0;
}

/**
 * Calcul mensualisation PAJEMPLOI.
 * La "mensualisation" lisse les heures sur 47 semaines travaillées.
 * Le plancher de paiement = 87% des heures contractuelles du mois.
 */
function calculHeuresGaranties(heuresContractuelles: number): number {
  // En cas d'absence non justifiée, le plancher est 87% des heures prévues
  return round2(heuresContractuelles * 0.87);
}

// =====================================================
// Calcul principal
// =====================================================

/**
 * Calcule une facture mensuelle complète pour un enfant/contrat.
 * 
 * Logique PAJEMPLOI simplifiée :
 * 1. Heures facturées = max(réalisées, heures garanties si mensualisation)
 * 2. Brut = heures facturées × tarif horaire
 * 3. Charges patronales = brut × taux patronal
 * 4. Charges salariales = brut × taux salarial
 * 5. Net = brut - charges salariales
 * 6. CMG = min(CMG_max, net + 50% charges patronales)
 *    → Le CMG couvre au max : net salarial + 50% des cotisations patronales
 * 7. Coût parent = (net + charges patronales) - CMG
 * 8. Total facture = coût parent + indemnités entretien + repas
 */
export function calculerFacture(input: CalculFactureInput): CalculFactureResult {
  const {
    heures_realisees,
    heures_contractuelles,
    tarif_horaire,
    tarif_entretien,
    jours_presences,
    repas,
    tarif_repas,
    cmg_niveau,
    age_enfant_mois,
  } = input;

  // 1. Mensualisation — plancher des heures garanties
  const heures_garanties = calculHeuresGaranties(heures_contractuelles);
  const mensualisation = heures_realisees < heures_garanties;
  const heures_facturees = mensualisation ? heures_garanties : heures_realisees;
  const heures_absences_deduites = mensualisation
    ? round2(heures_contractuelles - heures_realisees)
    : 0;

  // 2. Salaire brut
  const salaire_brut = round2(heures_facturees * tarif_horaire);

  // 3. Cotisations
  const cotisations_patronales = round2(salaire_brut * TAUX_COTISATIONS.patronales.total);
  const cotisations_salariales = round2(salaire_brut * TAUX_COTISATIONS.salariales.total);

  // 4. Net
  const salaire_net = round2(salaire_brut - cotisations_salariales);

  // 5. CMG
  const cmg_max = getMaxCmg(age_enfant_mois, cmg_niveau);
  // CMG couvre : net + 50% des cotisations patronales (mais pas plus que ce que le parent paie)
  const cout_eligible_cmg = round2(salaire_net + cotisations_patronales * 0.5);
  const cmg_montant = cmg_niveau > 0 ? round2(Math.min(cmg_max, cout_eligible_cmg)) : 0;
  const cmg_eligible = cmg_montant > 0;

  // 6. Indemnités (hors cotisations)
  const frais_entretien = round2(jours_presences * tarif_entretien);
  const frais_repas = round2(repas * tarif_repas);

  // 7. Coût salarial total pour le parent
  const cout_avant_cmg = round2(salaire_net + cotisations_patronales);
  const total_charges_parent = round2(cout_avant_cmg - cmg_montant);

  // 8. Total facture
  const total_facture = round2(total_charges_parent + frais_entretien + frais_repas);

  return {
    heures_facturees,
    heures_garanties,
    salaire_brut,
    cotisations_patronales,
    cotisations_salariales,
    salaire_net,
    cmg_montant,
    cmg_eligible,
    frais_entretien,
    frais_repas,
    total_charges_parent,
    total_facture,
    detail: {
      mensualisation,
      heures_absences_deduites,
      cout_avant_cmg,
      taux_patronal: TAUX_COTISATIONS.patronales.total,
      taux_salarial: TAUX_COTISATIONS.salariales.total,
    },
  };
}

// =====================================================
// Projection annuelle
// =====================================================

export interface ProjectionAnnuelleInput {
  tarif_horaire: number;
  heures_semaine: number;
  semaines_annee: number;         // Typiquement 47 (hors 5 semaines congés)
  tarif_entretien: number;
  jours_semaine: number;          // Jours gardés par semaine
  cmg_niveau: NiveauCMG;
  age_enfant_mois: number;
}

export interface ProjectionAnnuelleResult {
  heures_annee: number;
  salaire_brut_annee: number;
  salaire_net_annee: number;
  cmg_total_annee: number;
  frais_entretien_annee: number;
  cout_net_parent_annee: number;  // Ce que paient réellement les parents
  mensualite_approximative: number;  // /12 pour lisser
}

export function projectionAnnuelle(input: ProjectionAnnuelleInput): ProjectionAnnuelleResult {
  const {
    tarif_horaire,
    heures_semaine,
    semaines_annee,
    tarif_entretien,
    jours_semaine,
    cmg_niveau,
    age_enfant_mois,
  } = input;

  // Calcul annuel simplifié (sans mensualisation, heures réelles)
  const heures_annee = round2(heures_semaine * semaines_annee);
  const salaire_brut_annee = round2(heures_annee * tarif_horaire);
  const cotisations_salariales = round2(salaire_brut_annee * TAUX_COTISATIONS.salariales.total);
  const cotisations_patronales = round2(salaire_brut_annee * TAUX_COTISATIONS.patronales.total);
  const salaire_net_annee = round2(salaire_brut_annee - cotisations_salariales);

  // CMG mensuel × 12 (approximatif)
  const cmg_max_mensuel = getMaxCmg(age_enfant_mois, cmg_niveau);
  const cmg_total_annee = round2(cmg_max_mensuel * 12);  // Approximation

  const jours_annee = jours_semaine * semaines_annee;
  const frais_entretien_annee = round2(jours_annee * tarif_entretien);

  const cout_salaire_parent = round2(salaire_net_annee + cotisations_patronales);
  const cout_net_parent_annee = round2(cout_salaire_parent - cmg_total_annee + frais_entretien_annee);
  const mensualite_approximative = round2(cout_net_parent_annee / 12);

  return {
    heures_annee,
    salaire_brut_annee,
    salaire_net_annee,
    cmg_total_annee,
    frais_entretien_annee,
    cout_net_parent_annee,
    mensualite_approximative,
  };
}

// =====================================================
// Simulateur rapide (pour la landing page)
// =====================================================

export interface SimulateurInput {
  heures_semaine: number;
  tarif_horaire: number;
  cmg_niveau: NiveauCMG;
  age_enfant_mois: number;
}

export interface SimulateurResult {
  cout_mensuel_brut: number;          // Ce que coûte l'AM sans aide
  cmg_mensuel: number;                // Aide CAF
  cout_mensuel_parent: number;        // Coût réel pour le parent
  salaire_net_mensuel: number;        // Ce que gagne l'AM net
  economie_annuelle_cmg: number;      // Économie grâce au CMG sur 1 an
}

export function simulateur(input: SimulateurInput): SimulateurResult {
  const { heures_semaine, tarif_horaire, cmg_niveau, age_enfant_mois } = input;

  // Heures mensuelles = (heures semaine × 52) / 12
  const heures_mois = round2((heures_semaine * 52) / 12);
  const brut = round2(heures_mois * tarif_horaire);
  const cotisations_patronales = round2(brut * TAUX_COTISATIONS.patronales.total);
  const cotisations_salariales = round2(brut * TAUX_COTISATIONS.salariales.total);
  const net = round2(brut - cotisations_salariales);

  const cmg_max = getMaxCmg(age_enfant_mois, cmg_niveau);
  const cout_eligible_cmg = round2(net + cotisations_patronales * 0.5);
  const cmg_mensuel = cmg_niveau > 0 ? round2(Math.min(cmg_max, cout_eligible_cmg)) : 0;

  const cout_mensuel_brut = round2(net + cotisations_patronales);
  const cout_mensuel_parent = round2(cout_mensuel_brut - cmg_mensuel);

  return {
    cout_mensuel_brut,
    cmg_mensuel,
    cout_mensuel_parent,
    salaire_net_mensuel: net,
    economie_annuelle_cmg: round2(cmg_mensuel * 12),
  };
}

// =====================================================
// Générateur export PAJEMPLOI
// =====================================================

export interface LignePajemploi {
  prenom_enfant: string;
  nom_enfant: string;
  nir_am: string;            // Numéro de sécurité sociale de l'AM
  mois: number;
  annee: number;
  heures: number;
  salaire_net: number;
  salaire_brut: number;
}

export function formatPajemploi(lignes: LignePajemploi[]): string {
  const header = [
    'Prénom enfant',
    'Nom enfant',
    'NIR AM',
    'Mois',
    'Année',
    'Heures',
    'Salaire net (€)',
    'Salaire brut (€)',
  ].join(';');

  const rows = lignes.map((l) =>
    [
      l.prenom_enfant,
      l.nom_enfant,
      l.nir_am,
      l.mois.toString().padStart(2, '0'),
      l.annee,
      l.heures.toFixed(2),
      l.salaire_net.toFixed(2),
      l.salaire_brut.toFixed(2),
    ].join(';')
  );

  return [header, ...rows].join('\n');
}
