import type { Metadata } from 'next'
import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { JOB_TYPE } from '@/lib/labels'

export const metadata: Metadata = { title: 'Careers' }


export default async function Careers() {
  const jobs = await db.select().from(schema.jobs).where(eq(schema.jobs.open, true)).orderBy(desc(schema.jobs.createdAt))
  return (
    <div className="container py-14 md:py-20">
      <div className="max-w-2xl">
        <h1 className="text-5xl md:text-6xl">Work with us</h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">We’re a team of designers, karigars, gemologists and people who love helping someone choose a piece they’ll keep for life. Most roles are based in Mangaluru.</p>
      </div>
      <ul className="mt-12 divide-y border-y">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link href={`/careers/${j.slug}`} className="grid gap-2 py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[1.5fr_1fr_1fr_auto] sm:items-center sm:px-2">
              <span className="font-headline text-2xl">{j.title}</span>
              <span className="text-muted-foreground">{j.department}</span>
              <span className="text-muted-foreground">{j.location} · {JOB_TYPE[j.type]}</span>
              <span className="text-sm underline underline-offset-4">View role</span>
            </Link>
          </li>
        ))}
      </ul>
      {!jobs.length && <p className="mt-8 text-muted-foreground">No open roles right now. Write to hello@sparkle.com and we’ll keep your details on file.</p>}
    </div>
  )
}
