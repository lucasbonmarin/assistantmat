import Link from 'next/link';
import type { Metadata } from 'next';
import { simulateur } from '@/lib/calculations/cmg';

export const metadata: Metadata = {
  title: 'AssistantMat — Gestion administrative pour assistantes maternelles',
  description:
    'Gérez vos contrats, présences et factures en quelques clics. Calcul automatique CMG, PAJEMPLOI, cotisations. Gratuit pour commencer.',
  keywords: [
    'assistante maternelle',
    'gestion administrative AM',
    'PAJEMPLOI',
    'CMG complément mode de garde',
    'calcul cotisations AM',
    'logiciel assistante maternelle',
  ],
  openGraph: {
    title: 'AssistantMat — La gestion admin des AM, enfin simple',
    description: 'Contrats, présences, factures, CMG. Tout ce dont vous avez besoin en un seul endroit.',
    type: 'website',
  },
};

// Exemple de calcul pour la démo (rendu côté serveur — pas de flash)
const exempleCalc = simulateur({
  heures_semaine: 40,
  tarif_horaire: 4.20,
  cmg_niveau: 2,
  age_enfant_mois: 18,
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ==================== NAV ==================== */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧸</span>
            <span className="font-bold text-slate-900 text-lg">AssistantMat</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#fonctionnalites" className="hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#calcul" className="hover:text-slate-900 transition-colors">Calcul CMG</a>
            <a href="#tarifs" className="hover:text-slate-900 transition-colors">Tarifs</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors font-medium"
            >
              Démarrer gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span>✨</span>
            <span>Gratuit jusqu&apos;à 3 enfants — sans carte bancaire</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
            La gestion admin des AM,
            <br />
            <span className="text-violet-600">enfin simple.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Contrats, feuilles de présence, factures et calcul CMG automatique.
            Arrêtez de passer des heures sur PAJEMPLOI — faites-le en 5 minutes par mois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-violet-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-200"
            >
              Créer mon compte gratuit →
            </Link>
            <a
              href="#calcul"
              className="border border-slate-200 text-slate-700 px-8 py-4 rounded-xl text-lg font-medium hover:border-slate-300 transition-colors"
            >
              Simuler mon CMG
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-400">
            Déjà utilisé par des AM partout en France · Conforme PAJEMPLOI 2025
          </p>
        </div>
      </section>

      {/* ==================== STATS ==================== */}
      <section className="py-12 bg-slate-50 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { chiffre: '300k+', label: 'Assistantes maternelles en France' },
            { chiffre: '1 066 €', label: 'CMG maximum mensuel (enfant < 3 ans)' },
            { chiffre: '5 min', label: 'Pour générer une facture complète' },
            { chiffre: '0 €', label: 'Pour commencer (jusqu\'à 3 enfants)' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-bold text-violet-600 mb-1">{stat.chiffre}</div>
              <div className="text-sm text-slate-500 leading-snug">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== FONCTIONNALITÉS ==================== */}
      <section id="fonctionnalites" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Une seule application pour gérer l&apos;intégralité de votre activité d&apos;assistante maternelle.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📋',
                titre: 'Gestion des contrats',
                desc: "Créez et gérez les contrats d'accueil en quelques clics. Planning, horaires, tarifs — tout est structuré et conforme à la convention collective.",
              },
              {
                emoji: '📅',
                titre: 'Feuilles de présence',
                desc: "Saisissez les présences, absences et congés jour par jour. Le calendrier mensuel se remplit automatiquement et calcule les heures facturables.",
              },
              {
                emoji: '💶',
                titre: 'Facturation automatique',
                desc: "Générez les factures mensuelles en un clic. Salaire brut, charges URSSAF, CMG déduit — le calcul PAJEMPLOI est fait pour vous.",
              },
              {
                emoji: '🧮',
                titre: 'Calcul CMG précis',
                desc: "Estimez le Complément de Mode de Garde selon le niveau de ressources des parents. L'aide CAF est déduite automatiquement de chaque facture.",
              },
              {
                emoji: '📤',
                titre: 'Export PAJEMPLOI',
                desc: "Exportez vos données au format PAJEMPLOI en un clic. Plus besoin de re-saisir manuellement chaque mois sur le site gouvernemental.",
              },
              {
                emoji: '📊',
                titre: 'Tableau de bord',
                desc: "Vue d'ensemble de vos revenus, des présences du mois et des factures en attente. Gardez le contrôle de votre activité en temps réel.",
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 hover:border-violet-200 hover:shadow-sm transition-all">
                <div className="text-3xl mb-4">{feature.emoji}</div>
                <h3 className="font-semibold text-slate-900 text-lg mb-2">{feature.titre}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SIMULATEUR CMG ==================== */}
      <section id="calcul" className="py-20 px-4 bg-gradient-to-br from-violet-50 to-indigo-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Exemple de calcul CMG
            </h2>
            <p className="text-lg text-slate-500">
              Pour un enfant de 18 mois, 40h/semaine, tarif 4,20 €/h, CMG niveau 2
            </p>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                  Paramètres
                </h3>
                <div className="space-y-3">
                  {[
                    { label: 'Âge enfant', val: '18 mois' },
                    { label: 'Heures / semaine', val: '40h' },
                    { label: 'Tarif horaire', val: '4,20 €/h' },
                    { label: 'Semaines travaillées', val: '47 semaines/an' },
                    { label: 'Niveau CMG', val: 'Niveau 2 (ressources moyennes)' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="font-medium text-slate-800">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">
                  Résultat mensuel
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Coût brut (salaire + charges)</span>
                    <span className="font-medium text-slate-800">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(exempleCalc.cout_mensuel_brut)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Aide CMG (payée par la CAF)</span>
                    <span className="font-medium text-green-600">
                      − {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(exempleCalc.cmg_mensuel)}
                    </span>
                  </div>
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-semibold text-slate-900">Coût réel pour les parents</span>
                    <span className="font-bold text-violet-600 text-xl">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(exempleCalc.cout_mensuel_parent)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Salaire net de l&apos;AM</span>
                    <span className="font-medium text-slate-800">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(exempleCalc.salaire_net_mensuel)}
                    </span>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 mt-2">
                    <p className="text-green-700 text-sm font-medium">
                      💰 Économie grâce au CMG : {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(exempleCalc.economie_annuelle_cmg)}/an
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-slate-400 mb-4">
                Calcul basé sur les taux PAJEMPLOI et les barèmes CMG 2025 · Résultat indicatif
              </p>
              <Link
                href="/register"
                className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-700 transition-colors"
              >
                Calculer avec mes données →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== PERSONAS ==================== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Fait pour les AM qui ont mieux à faire
          </h2>
          <p className="text-lg text-slate-500 text-center mb-16 max-w-xl mx-auto">
            Que vous débutiez ou que vous gériez plusieurs enfants, AssistantMat s&apos;adapte à votre activité.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                emoji: '🌱',
                titre: 'Je démarre',
                desc: "Je viens d'obtenir mon agrément. Je veux mettre en place un suivi professionnel dès le début sans me noyer dans les formulaires.",
                avantages: ['Modèles de contrats inclus', 'Tutoriel pas à pas', 'Gratuit jusqu\'à 3 enfants'],
              },
              {
                emoji: '📈',
                titre: 'J\'ai 2-4 enfants',
                desc: 'Je suis en activité depuis quelques années. Les fins de mois sont laborieuses entre feuilles Excel et PAJEMPLOI.',
                avantages: ['Facturation en 1 clic', 'CMG calculé automatiquement', 'Rappels de paiement'],
              },
              {
                emoji: '🎯',
                titre: 'Je veux optimiser',
                desc: "Je cherche à mieux suivre mes revenus annuels et à être prête pour le contrôle URSSAF.",
                avantages: ['Récap fiscal annuel', 'Export comptable', 'Historique complet'],
              },
            ].map((persona, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 p-6">
                <div className="text-4xl mb-4">{persona.emoji}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{persona.titre}</h3>
                <p className="text-slate-500 text-sm mb-4 leading-relaxed">{persona.desc}</p>
                <ul className="space-y-2">
                  {persona.avantages.map((a, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-violet-500">✓</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TARIFS ==================== */}
      <section id="tarifs" className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">Tarifs simples</h2>
          <p className="text-lg text-slate-500 text-center mb-12">
            Commencez gratuitement. Passez au pro quand vous en avez besoin.
          </p>
          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Gratuit */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <div className="text-3xl font-bold text-slate-900 mb-1">0 €</div>
              <div className="text-slate-500 text-sm mb-6">Pour toujours · Sans carte bancaire</div>
              <div className="font-semibold text-slate-900 mb-2">Gratuit</div>
              <ul className="space-y-3 text-sm text-slate-600 mb-8">
                {[
                  'Jusqu\'à 3 enfants',
                  'Contrats illimités',
                  'Feuilles de présence',
                  'Calcul CMG',
                  'Factures mensuelles',
                  'Export PDF',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center border border-violet-600 text-violet-600 px-6 py-3 rounded-xl font-medium hover:bg-violet-50 transition-colors"
              >
                Créer mon compte
              </Link>
            </div>
            {/* Pro */}
            <div className="bg-violet-600 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                POPULAIRE
              </div>
              <div className="text-3xl font-bold mb-1">9,90 €</div>
              <div className="text-violet-200 text-sm mb-6">/ mois · Sans engagement</div>
              <div className="font-semibold mb-2">Pro</div>
              <ul className="space-y-3 text-sm text-violet-100 mb-8">
                {[
                  'Enfants illimités',
                  'Tout du plan gratuit',
                  'Export PAJEMPLOI CSV',
                  'Rappels automatiques (email)',
                  'Récapitulatif fiscal annuel',
                  'Support prioritaire',
                  'Multi-appareil (mobile + desktop)',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-yellow-300 font-bold">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center bg-white text-violet-600 px-6 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors"
              >
                Démarrer l&apos;essai gratuit →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FAQ ==================== */}
      <section id="faq" className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Questions fréquentes
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Oui. Toutes les données sont chiffrées et stockées en France (Supabase EU). Vous êtes propriétaire de vos données et pouvez les exporter ou supprimer à tout moment.",
              },
              {
                q: "Le calcul CMG est-il fiable ?",
                a: "Le calcul est basé sur les barèmes officiels de la CAF et les taux PAJEMPLOI 2025. Il est mis à jour automatiquement chaque année. Il est indicatif — nous recommandons de toujours vérifier avec votre CAF.",
              },
              {
                q: "Je peux remplacer PAJEMPLOI avec AssistantMat ?",
                a: "AssistantMat vous aide à préparer vos déclarations PAJEMPLOI et vous fournit les données au bon format. La déclaration finale se fait toujours sur PAJEMPLOI (obligatoire légalement), mais avec nos exports, ça prend 2 minutes.",
              },
              {
                q: "Y a-t-il une application mobile ?",
                a: "AssistantMat est une application web progressive (PWA) qui fonctionne sur tous les appareils — téléphone, tablette, ordinateur. Pas besoin de télécharger depuis l'App Store.",
              },
              {
                q: "Que se passe-t-il si j'ai plus de 3 enfants et que je reste en gratuit ?",
                a: "Vous pouvez consulter les données existantes mais ne pouvez pas en ajouter de nouvelles. Le passage au Pro est sans engagement et immédiat.",
              },
            ].map((faq, i) => (
              <details key={i} className="group border border-slate-200 rounded-xl">
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-medium text-slate-900">
                  {faq.q}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA FINAL ==================== */}
      <section className="py-20 px-4 bg-gradient-to-br from-violet-600 to-indigo-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prête à reprendre le contrôle de votre administratif ?
          </h2>
          <p className="text-violet-200 text-lg mb-8">
            Rejoignez les assistantes maternelles qui ont dit adieu aux tableurs Excel.
          </p>
          <Link
            href="/register"
            className="bg-white text-violet-700 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-50 transition-colors shadow-xl"
          >
            Créer mon compte gratuit →
          </Link>
          <p className="text-violet-300 text-sm mt-4">
            Sans engagement · Sans carte bancaire · 3 enfants gratuits pour toujours
          </p>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="py-12 px-4 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧸</span>
            <span className="font-semibold text-slate-700">AssistantMat</span>
            <span className="text-slate-400 text-sm">— La gestion admin des AM, enfin simple.</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700">Mentions légales</a>
            <a href="#" className="hover:text-slate-700">CGU</a>
            <a href="#" className="hover:text-slate-700">Contact</a>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} AssistantMat · Calcul PAJEMPLOI 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
