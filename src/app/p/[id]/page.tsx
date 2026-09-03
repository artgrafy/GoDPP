import { SEED_PASSPORTS } from '@/lib/seedData';
import { PassportDetailClient } from '@/components/PassportDetailClient';

export function generateStaticParams() {
  return SEED_PASSPORTS.map((p) => ({
    id: p.id,
  }));
}

export default function PassportPage({ params }: { params: { id: string } }) {
  return <PassportDetailClient passportId={params.id} />;
}
