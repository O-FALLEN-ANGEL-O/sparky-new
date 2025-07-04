'use server';

import { getDeliveryById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { DeliveryDetailView } from '@/components/delivery/delivery-detail-view';

export default async function DeliveryDetailPage({ params }: { params: { id: string } }) {
  const delivery = await getDeliveryById(params.id);

  if (!delivery) {
    notFound();
  }

  return <DeliveryDetailView initialDelivery={delivery} />;
}
