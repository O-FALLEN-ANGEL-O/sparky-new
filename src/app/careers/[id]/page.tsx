'use server';

import { getJobById } from '@/lib/db';
import { notFound } from 'next/navigation';
import { JobApplicationView } from '@/components/careers/job-application-view';

export default async function JobApplicationPage({ params }: { params: { id: string } }) {
  const job = await getJobById(params.id);

  if (!job) {
    notFound();
  }

  return <JobApplicationView job={job} />;
}
