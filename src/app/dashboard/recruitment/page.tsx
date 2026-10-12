import Link from 'next/link'
import { desc, eq, sql } from 'drizzle-orm'
import { setJobOpen } from '@/app/actions/people'
import { ActionButton } from '@/components/dash/action-button'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { ago } from '@/lib/format'
import { JOB_TYPE } from '@/lib/labels'
import { requireUser } from '@/lib/server/auth'
import { APPLICATION_STAGES as STAGES } from '@/lib/labels'
import { NewJobForm, StageSelect } from './recruit-ui'

export const metadata = { title: 'Recruitment' }

export default async function Recruitment() {
  await requireUser({ permission: 'recruitment.manage' })
  const [jobs, apps] = await Promise.all([
    db
      .select({ j: schema.jobs, n: sql<number>`(select count(*)::int from applications a where a.job_id = ${schema.jobs.id})` })
      .from(schema.jobs)
      .orderBy(desc(schema.jobs.open), desc(schema.jobs.createdAt)),
    db.select({ a: schema.applications, job: schema.jobs.title }).from(schema.applications).innerJoin(schema.jobs, eq(schema.jobs.id, schema.applications.jobId)).orderBy(desc(schema.applications.createdAt)),
  ])
  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment" description="Roles you publish appear on the public careers page. Applications land here." />
      <NewJobForm />
      <Panel title="Roles" bodyClassName="p-0">
        <ul className="divide-y">
          {jobs.map(({ j, n }) => (
            <li key={j.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="flex-1">
                <Link href={`/careers/${j.slug}`} className="font-medium underline-offset-4 hover:underline">{j.title}</Link>
                <span className="block text-sm text-muted-foreground">{j.department} · {j.location} · {JOB_TYPE[j.type]} · {n} applicant{n === 1 ? '' : 's'}</span>
              </span>
              <Pill tone={j.open ? 'ok' : 'neutral'}>{j.open ? 'Open' : 'Closed'}</Pill>
              <ActionButton size="sm" variant="outline" action={setJobOpen.bind(null, j.id, !j.open)}>{j.open ? 'Close role' : 'Reopen'}</ActionButton>
            </li>
          ))}
        </ul>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        {STAGES.map(([stage, label]) => {
          const list = apps.filter((a) => a.a.status === stage)
          return (
            <Panel key={stage} title={`${label} (${list.length})`} bodyClassName="space-y-3 p-3">
              {list.length ? (
                list.map(({ a, job }) => (
                  <article key={a.id} className="space-y-2 rounded-md border bg-background p-3 text-sm">
                    <p className="font-medium">{a.name}</p>
                    <p className="text-muted-foreground">{job}</p>
                    <p className="text-muted-foreground">{a.email} · {a.phone}</p>
                    {a.portfolioUrl && <a href={a.portfolioUrl} target="_blank" rel="noreferrer noopener" className="block truncate underline underline-offset-4">Portfolio</a>}
                    <details>
                      <summary className="cursor-pointer text-muted-foreground">Cover note</summary>
                      <p className="mt-1 whitespace-pre-line">{a.coverLetter}</p>
                    </details>
                    <div className="flex items-center justify-between gap-2">
                      <StageSelect id={a.id} status={a.status} />
                      <span className="text-xs text-muted-foreground">{ago(a.createdAt)}</span>
                    </div>
                  </article>
                ))
              ) : (
                <Empty title="None" />
              )}
            </Panel>
          )
        })}
      </div>
    </div>
  )
}
