-- AssistantMat — Initial Schema
-- Gestion administrative pour assistantes maternelles (AM)
-- Calcul CMG/CAF, PAJEMPLOI, présences, facturation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: assistantes
-- Profil de l'assistante maternelle (propriétaire du compte)
-- =====================================================
CREATE TABLE assistantes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  prenom      TEXT NOT NULL,
  nom         TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  telephone   TEXT,
  siret       TEXT,                         -- SIRET (pas obligatoire pour les AM)
  numero_agrement TEXT,                     -- Numéro d'agrément PMI
  adresse     TEXT,
  code_postal TEXT,
  ville       TEXT,
  capacite_accueil INTEGER DEFAULT 4,       -- Enfants max agréés (default 4)
  tarif_horaire_defaut NUMERIC(6,2) DEFAULT 3.90, -- Tarif par défaut (min légal 2025)
  tarif_entretien_defaut NUMERIC(6,2) DEFAULT 3.30, -- Indemnité entretien par défaut
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: enfants
-- Enfants confiés à l'AM
-- =====================================================
CREATE TABLE enfants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assistante_id   UUID REFERENCES assistantes(id) ON DELETE CASCADE NOT NULL,
  prenom          TEXT NOT NULL,
  nom             TEXT NOT NULL,
  date_naissance  DATE NOT NULL,
  -- Parent principal
  parent1_prenom  TEXT NOT NULL,
  parent1_nom     TEXT NOT NULL,
  parent1_email   TEXT,
  parent1_tel     TEXT,
  -- Parent secondaire (optionnel)
  parent2_prenom  TEXT,
  parent2_nom     TEXT,
  parent2_email   TEXT,
  parent2_tel     TEXT,
  -- Infos CAF
  allocataire_caf TEXT,                     -- N° allocataire CAF du parent
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  archived_at     TIMESTAMPTZ
);

-- =====================================================
-- Table: contrats
-- Contrat de travail AM ↔ famille
-- =====================================================
CREATE TYPE statut_contrat AS ENUM ('brouillon', 'actif', 'suspendu', 'termine');

CREATE TABLE contrats (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enfant_id             UUID REFERENCES enfants(id) ON DELETE CASCADE NOT NULL,
  assistante_id         UUID REFERENCES assistantes(id) ON DELETE CASCADE NOT NULL,
  date_debut            DATE NOT NULL,
  date_fin              DATE,
  -- Planning
  heures_semaine        NUMERIC(5,2) NOT NULL,   -- Heures hebdomadaires prévues
  jours_semaine         TEXT[] DEFAULT '{"lundi","mardi","mercredi","jeudi","vendredi"}',
  semaines_annee        INTEGER DEFAULT 47,      -- Semaines travaillées (hors vacances)
  -- Rémunération
  tarif_horaire         NUMERIC(6,2) NOT NULL,   -- € brut/heure
  tarif_entretien       NUMERIC(6,2) DEFAULT 3.30, -- Indemnité entretien quotidienne €
  repas_inclus          BOOLEAN DEFAULT FALSE,
  tarif_repas           NUMERIC(5,2) DEFAULT 0,  -- € par repas si inclus
  -- CMG (Complément de Mode de Garde)
  cmg_niveau            INTEGER DEFAULT 0,       -- 0=pas de CMG, 1=plafond max, 2=moyen, 3=minimal
  -- Statut
  statut                statut_contrat DEFAULT 'brouillon',
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Table: presences
-- Feuille de présence quotidienne
-- =====================================================
CREATE TYPE type_presence AS ENUM (
  'presence',           -- Journée normale
  'absence_payee',      -- Absence payée par les parents
  'absence_non_payee',  -- Absence non payée (enfant malade > franchise)
  'conge_am',           -- Congé de l'AM
  'jf_non_travaille',   -- Jour férié non travaillé
  'fermeture'           -- Fermeture exceptionnelle
);

CREATE TABLE presences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enfant_id       UUID REFERENCES enfants(id) ON DELETE CASCADE NOT NULL,
  contrat_id      UUID REFERENCES contrats(id) ON DELETE CASCADE NOT NULL,
  assistante_id   UUID REFERENCES assistantes(id) ON DELETE CASCADE NOT NULL,
  date            DATE NOT NULL,
  type            type_presence DEFAULT 'presence',
  heure_debut     TIME,
  heure_fin       TIME,
  heures_realisees NUMERIC(4,2) GENERATED ALWAYS AS (
    CASE WHEN heure_debut IS NOT NULL AND heure_fin IS NOT NULL
    THEN EXTRACT(EPOCH FROM (heure_fin - heure_debut)) / 3600.0
    ELSE 0 END
  ) STORED,
  repas           BOOLEAN DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enfant_id, date)                         -- Une seule présence par enfant par jour
);

-- =====================================================
-- Table: factures
-- Factures mensuelles générées automatiquement
-- =====================================================
CREATE TYPE statut_facture AS ENUM ('brouillon', 'envoyee', 'payee', 'annulee');

CREATE TABLE factures (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enfant_id             UUID REFERENCES enfants(id) ON DELETE CASCADE NOT NULL,
  contrat_id            UUID REFERENCES contrats(id) ON DELETE CASCADE NOT NULL,
  assistante_id         UUID REFERENCES assistantes(id) ON DELETE CASCADE NOT NULL,
  -- Période
  mois                  INTEGER NOT NULL CHECK (mois BETWEEN 1 AND 12),
  annee                 INTEGER NOT NULL,
  -- Heures
  heures_realisees      NUMERIC(6,2) NOT NULL DEFAULT 0,
  heures_contractuelles NUMERIC(6,2) NOT NULL DEFAULT 0,  -- Heures prévues au contrat ce mois
  heures_facturees      NUMERIC(6,2) NOT NULL DEFAULT 0,  -- Max(realisees, garanties)
  -- Calcul salarial PAJEMPLOI
  salaire_brut          NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Heures × tarif
  cotisations_patronales NUMERIC(8,2) NOT NULL DEFAULT 0, -- ~24.5% du brut
  cotisations_salariales NUMERIC(8,2) NOT NULL DEFAULT 0, -- ~21% du brut  
  salaire_net           NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Brut - cotisations salariales
  -- CMG
  cmg_montant           NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Montant CMG (payé par CAF directement à l'AM)
  -- Indemnités
  frais_entretien       NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Jours × tarif entretien
  frais_repas           NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Repas × tarif repas
  -- Totaux
  total_charges_parent  NUMERIC(8,2) NOT NULL DEFAULT 0,  -- Net + patronales - CMG
  total_facture         NUMERIC(8,2) NOT NULL DEFAULT 0,  -- total_charges_parent + frais_entretien + frais_repas
  -- Statut
  statut                statut_facture DEFAULT 'brouillon',
  pajemploi_ref         TEXT,                             -- Référence PAJEMPLOI
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(enfant_id, mois, annee)
);

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE assistantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enfants ENABLE ROW LEVEL SECURITY;
ALTER TABLE contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE presences ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

-- Assistantes: own profile only
CREATE POLICY "assistantes_own" ON assistantes
  USING (user_id = auth.uid());

-- Enfants: via assistante ownership
CREATE POLICY "enfants_own" ON enfants
  USING (assistante_id IN (SELECT id FROM assistantes WHERE user_id = auth.uid()));

-- Contrats: via assistante ownership
CREATE POLICY "contrats_own" ON contrats
  USING (assistante_id IN (SELECT id FROM assistantes WHERE user_id = auth.uid()));

-- Présences: via assistante ownership
CREATE POLICY "presences_own" ON presences
  USING (assistante_id IN (SELECT id FROM assistantes WHERE user_id = auth.uid()));

-- Factures: via assistante ownership
CREATE POLICY "factures_own" ON factures
  USING (assistante_id IN (SELECT id FROM assistantes WHERE user_id = auth.uid()));

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_enfants_assistante ON enfants(assistante_id);
CREATE INDEX idx_contrats_enfant ON contrats(enfant_id);
CREATE INDEX idx_contrats_assistante ON contrats(assistante_id);
CREATE INDEX idx_presences_enfant_date ON presences(enfant_id, date);
CREATE INDEX idx_presences_assistante ON presences(assistante_id);
CREATE INDEX idx_factures_assistante ON factures(assistante_id);
CREATE INDEX idx_factures_periode ON factures(annee, mois);

-- =====================================================
-- Triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER contrats_updated_at BEFORE UPDATE ON contrats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER factures_updated_at BEFORE UPDATE ON factures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
