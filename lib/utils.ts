import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { fr } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatte un montant en euros */
export function formatEuros(amount: number, decimals = 2): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/** Formatte une date ISO en français */
export function formatDate(date: string | Date, fmt = 'dd MMMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: fr });
}

/** Formatte un mois/année */
export function formatMoisAnnee(mois: number, annee: number): string {
  const d = new Date(annee, mois - 1, 1);
  return format(d, 'MMMM yyyy', { locale: fr });
}

/** Âge en mois d'un enfant */
export function ageEnMois(dateNaissance: string | Date, reference?: Date): number {
  const dNaiss = typeof dateNaissance === 'string' ? parseISO(dateNaissance) : dateNaissance;
  return differenceInMonths(reference ?? new Date(), dNaiss);
}

/** Âge formaté pour affichage */
export function formatAge(dateNaissance: string): string {
  const mois = ageEnMois(dateNaissance);
  if (mois < 12) return `${mois} mois`;
  const ans = Math.floor(mois / 12);
  const moisReste = mois % 12;
  if (moisReste === 0) return `${ans} an${ans > 1 ? 's' : ''}`;
  return `${ans} an${ans > 1 ? 's' : ''} et ${moisReste} mois`;
}

/** Obtenir le mois et l'année courants */
export function getMoisCourant(): { mois: number; annee: number } {
  const now = new Date();
  return { mois: now.getMonth() + 1, annee: now.getFullYear() };
}

/** Heures mensuelles à partir des heures hebdomadaires (sur 47 semaines) */
export function heureMensuelle(heuresSemaine: number, semainesAnnee = 47): number {
  return Math.round(((heuresSemaine * semainesAnnee) / 12) * 100) / 100;
}

/** Libellé du niveau CMG */
export function labelCmg(niveau: 0 | 1 | 2 | 3): string {
  switch (niveau) {
    case 0: return 'Sans CMG';
    case 1: return 'CMG niveau 1 (ressources modestes)';
    case 2: return 'CMG niveau 2 (ressources moyennes)';
    case 3: return 'CMG niveau 3 (ressources élevées)';
  }
}

/** Libellé du type de présence */
export function labelPresence(type: string): string {
  const labels: Record<string, string> = {
    presence: 'Présence',
    absence_payee: 'Absence payée',
    absence_non_payee: 'Absence non payée',
    conge_am: 'Congé AM',
    jf_non_travaille: 'Jour férié',
    fermeture: 'Fermeture',
  };
  return labels[type] ?? type;
}
