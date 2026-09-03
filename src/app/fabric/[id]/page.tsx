import { SEED_FABRICS } from '@/lib/seedData';
import { FabricDetailClient } from '@/components/FabricDetailClient';

export function generateStaticParams() {
  return SEED_FABRICS.map((f) => ({
    id: f.id,
  }));
}

export default function FabricPage({ params }: { params: { id: string } }) {
  return <FabricDetailClient fabricId={params.id} />;
}
