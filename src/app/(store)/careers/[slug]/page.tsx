import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { JOB_TYPE } from '@/lib/labels'
import { ApplyForm } from './apply-form'

type Props = { params: Promise<{ slug: string }> }

async function getJob(slug: string) {
  const [job] = await db.select().from(schema.jobs).where(and(eq(schema.jobs.slug, slug), eq(schema.jobs.open, true)))
  return job
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const job = await getJob((await params).slug)
  return { title: job ? job.title : 'Role not found' }
}

export default async function Job({ params }: Props) {
  const job = await getJob((await params).slug)
  if (!job) notFound()
  return (
    <div className="container grid gap-14 py-14 md:grid-cols-[1.3fr_1fr] md:py-20">
      <article>
        <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">All roles</Link>
        <h1 className="mt-2 text-5xl">{job.title}</h1>
        <p className="mt-3 text-muted-foreground">{job.department} · {job.location} · {JOB_TYPE[job.type]}</p>
        <p className="mt-8 max-w-prose text-lg leading-relaxed">{job.description}</p>
        <h2 className="mt-10 text-3xl">What you’ll bring</h2>
        <ul className="mt-4 max-w-prose list-disc space-y-2 pl-5 leading-relaxed text-muted-foreground">
          {job.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </article>
      <aside className="h-fit border p-6 md:sticky md:top-28">
        <h2 className="mb-5 text-3xl">Apply</h2>
        <ApplyForm jobId={job.id} />
      </aside>
    </div>
  )
}
