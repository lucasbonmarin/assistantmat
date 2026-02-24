import { createClient } from '@/lib/supabase/server';
import { formatMoisAnnee } from '@/lib/utils';
import { formatPajemploi } from '@/lib/calculations/cmg';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mois = parseInt(searchParams.get('mois') ?? new Date().getMonth() + 1 + '');
  const annee = parseInt(searchParams.get('annee') ?? new Date().getFullYear() + '');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { data: assistante } = await supabase
    .from('assistantes').select('*').eq('user_id', user.id).single();

  if (!assistante) {
    return new Response('Not found', { status: 404 });
  }

  const { data: factures } = await supabase
    .from('factures')
    .select('*, enfants(prenom, nom)')
    .eq('assistante_id', assistante.id)
    .eq('mois', mois)
    .eq('annee', annee);

  if (!factures || factures.length === 0) {
    return new Response('No data', { status: 404 });
  }

  const lignes = factures.map((f: {
    enfants: { prenom: string; nom: string }[] | null;
    mois: number;
    annee: number;
    heures_facturees: number;
    salaire_net: number;
    salaire_brut: number;
  }) => ({
    prenom_enfant: f.enfants?.[0]?.prenom ?? '',
    nom_enfant: f.enfants?.[0]?.nom ?? '',
    nir_am: assistante.siret ?? '',  // En réalité ce serait le NIR mais on utilise le SIRET pour la démo
    mois: f.mois,
    annee: f.annee,
    heures: f.heures_facturees,
    salaire_net: f.salaire_net,
    salaire_brut: f.salaire_brut,
  }));

  const csv = formatPajemploi(lignes);
  const moisLabel = formatMoisAnnee(mois, annee);
  const filename = `pajemploi_${annee}_${mois.toString().padStart(2, '0')}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
