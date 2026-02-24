# 🧸 AssistantMat

**La gestion administrative des assistantes maternelles, enfin simple.**

> Contrats, présences, factures, calcul CMG/PAJEMPLOI — tout en un.

---

## Le problème

Il y a **300 000 assistantes maternelles** en France. Chaque mois, elles doivent :

1. Calculer les heures de chaque enfant
2. Calculer les cotisations URSSAF (taux variables)
3. Déduire le CMG (Complément de Mode de Garde) de la CAF
4. Saisir tout ça manuellement sur PAJEMPLOI (interface gouvernementale archaïque)
5. Envoyer les factures aux parents

Ce processus prend 1 à 3 heures par mois par enfant. Pour une AM avec 4 enfants = **12h/mois d'administratif pur**.

## La solution

AssistantMat automatise tout ça :

- **5 minutes** par mois pour générer toutes les factures
- **Calcul CMG exact** selon les barèmes CAF 2025
- **Export PAJEMPLOI** au bon format (plus de re-saisie)
- **Interface moderne** vs le site gouvernemental des années 2000

## Stack technique

- **Frontend** : Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes (Edge-compatible)
- **Base de données** : Supabase (PostgreSQL + Auth + RLS)
- **Hébergement** : Vercel (recommandé)

## Fonctionnalités MVP

### 👶 Gestion des enfants
- Profils enfants avec date de naissance et coordonnées parents
- Calcul automatique de l'âge (important pour le plafond CMG)

### 📋 Contrats
- Contrats d'accueil avec planning, tarifs, options CMG
- Support mensualisation PAJEMPLOI (plancher 87%)

### 📅 Feuilles de présence
- Saisie quotidienne (présence, absence payée/non payée, congé AM, jour férié)
- Vue calendrier 14 jours
- Comptage automatique des heures réalisées

### 💶 Facturation
- Génération automatique en 1 clic
- Calcul complet : brut → cotisations → net → CMG → total parent
- Tableau de bord mensuel avec récap
- Export CSV au format PAJEMPLOI

### 🧮 Moteur de calcul CMG (lib/calculations/cmg.ts)
```typescript
// Exemple
const result = calculerFacture({
  heures_realisees: 160,
  heures_contractuelles: 170,
  tarif_horaire: 4.20,
  tarif_entretien: 3.30,
  jours_presences: 20,
  repas: 0,
  tarif_repas: 0,
  cmg_niveau: 2,         // 1=modeste, 2=moyen, 3=élevé
  age_enfant_mois: 18,
});
// {
//   salaire_brut: 714,
//   salaire_net: 617.90,
//   cotisations_patronales: 239.14,
//   cmg_montant: 595.90,   ← Déduit du coût parent !
//   total_facture: 327.44  ← Ce que la famille paie vraiment
// }
```

## Installation

### Prérequis
- Node.js 18+
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)

### Développement local

```bash
# Cloner le repo
git clone https://github.com/lucasbonmarin/assistantmat
cd assistantmat

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY

# Lancer le dev server
npm run dev
```

### Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans l'éditeur SQL
3. Coller et exécuter le contenu de `supabase/migrations/001_initial_schema.sql`
4. Copier l'URL et la clé anon dans `.env.local`

### Déployer sur Vercel

```bash
vercel --prod
# Ajouter les variables d'environnement dans le dashboard Vercel
```

## Architecture

```
assistantmat/
├── app/
│   ├── page.tsx                    # Landing page (public)
│   ├── (auth)/
│   │   ├── login/page.tsx          # Connexion
│   │   └── register/page.tsx       # Inscription AM
│   ├── (app)/
│   │   ├── layout.tsx              # App shell (sidebar, auth guard)
│   │   ├── dashboard/page.tsx      # Tableau de bord
│   │   ├── enfants/page.tsx        # Gestion enfants
│   │   ├── presences/page.tsx      # Feuilles de présence
│   │   └── factures/page.tsx       # Factures
│   └── api/
│       ├── auth/signout/route.ts   # Déconnexion
│       └── export/pajemploi/route.ts  # Export CSV PAJEMPLOI
├── lib/
│   ├── calculations/
│   │   └── cmg.ts                  # 🧠 Moteur de calcul CMG/PAJEMPLOI
│   ├── supabase/
│   │   ├── client.ts               # Client browser
│   │   ├── server.ts               # Client SSR
│   │   └── types.ts                # Types TypeScript
│   └── utils.ts                    # Utilitaires
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql  # Schema complet avec RLS
└── middleware.ts                   # Auth guard (routes protégées)
```

## Roadmap

### V1 (MVP actuel)
- [x] Schema Supabase avec RLS
- [x] Auth (inscription/connexion AM)
- [x] Landing page avec simulateur CMG
- [x] Dashboard avec KPIs
- [x] Gestion enfants
- [x] Feuilles de présence
- [x] Factures avec calcul CMG
- [x] Export PAJEMPLOI CSV

### V2
- [ ] Formulaire d'ajout d'enfant (`/enfants/nouveau`)
- [ ] Formulaire d'ajout de présence (`/presences/nouveau`)
- [ ] Génération de factures (`/factures/generer`)
- [ ] Envoi email aux parents (Resend)
- [ ] PDF des factures (react-pdf)
- [ ] Récapitulatif fiscal annuel (attestation CAF)

### V3
- [ ] Application mobile PWA
- [ ] Rappels automatiques (facture non payée)
- [ ] Portail parents (vue lecture seule)
- [ ] Multi-AM (agences/RAM)

## Sources légales

- [PAJEMPLOI — service-public.fr](https://www.pajemploi.urssaf.fr/)
- [CMG — CAF.fr](https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/petite-enfance/le-complement-de-libre-choix-du-mode-de-garde-cmg)
- [Convention collective nationale des AM](https://www.legifrance.gouv.fr/conv_coll/id/KALICONT000005635807/)
- [Barème PAJEMPLOI 2025](https://www.pajemploi.urssaf.fr/pajewebinfo/cms/sites/pajewebinfo/accueil/employeur-de-baby-sitter/je-minforme/les-taux-de-cotisations.html)

## Contexte

Projet lancé en février 2026. Idée initiale : la compagne de Lucas travaille en crèche et il a un bébé prévu en juin 2026. Le secteur de la petite enfance est massivement sous-digitalisé — PAJEMPLOI date de 2009 et l'interface n'a pas changé.

**Marché cible :** 300 000 assistantes maternelles agréées en France, renouvellement constant (40 000 nouvelles AM/an).

**Pricing :** Gratuit jusqu'à 3 enfants / 9,90€/mois illimité.

---

*AssistantMat — Parce que les AM méritent mieux qu'un tableur Excel.*
