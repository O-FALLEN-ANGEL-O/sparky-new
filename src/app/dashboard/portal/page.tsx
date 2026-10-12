import { and, asc, desc, eq } from 'drizzle-orm'
import { deleteAnnouncement } from '@/app/actions/people'
import { ActionButton } from '@/components/dash/action-button'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { ago, dateShort, monthLabel } from '@/lib/format'
import { formatINR } from '@/lib/pricing'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { announcements } from '@/lib/server/people'
import { Step } from '../onboarding/onboarding-ui'
import { AnnounceForm } from './announce-form'

export const metadata = { title: 'HR portal' }

export default async function Portal() {
  const me = await requireUser({ permission: 'portal.view' })
  const canPost = can(me.role, 'announcements.manage')
  const [news, policies, slips, onboarding] = await Promise.all([
    announcements(20),
    db.select().from(schema.policies).orderBy(asc(schema.policies.category)),
    db
      .select({ s: schema.payslips, month: schema.payrollRuns.month })
      .from(schema.payslips)
      .innerJoin(schema.payrollRuns, eq(schema.payrollRuns.id, schema.payslips.runId))
      .where(and(eq(schema.payslips.userId, me.id), eq(schema.payrollRuns.status, 'processed')))
      .orderBy(desc(schema.payrollRuns.month)),
    db.select().from(schema.onboardingTasks).where(eq(schema.onboardingTasks.userId, me.id)).orderBy(asc(schema.onboardingTasks.sort)),
  ])
  const visibleSlips = slips
  return (
    <div className="space-y-6">
      <PageHeader title="HR portal" description="Company news, policies, and your own payslips." />
      {onboarding.length > 0 && onboarding.some((o) => !o.done) && (
        <Panel title="Your first weeks" description={`${onboarding.filter((o) => o.done).length} of ${onboarding.length} steps done`}>
          <div className="divide-y">
            {onboarding.map((o) => <Step key={o.id} id={o.id} title={o.title} done={o.done} due={o.dueDate ? dateShort(o.dueDate) : undefined} />)}
          </div>
        </Panel>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Announcements">
          {canPost && <div className="mb-5"><AnnounceForm /></div>}
          <ul className="space-y-5">
            {news.map(({ a, author }) => (
              <li key={a.id} className="border-b pb-5 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-headline text-xl">{a.title} {a.pinned && <Pill tone="gold">Pinned</Pill>}</h3>
                  {canPost && <ActionButton size="sm" variant="ghost" confirm="Delete this announcement?" action={deleteAnnouncement.bind(null, a.id)}>Delete</ActionButton>}
                </div>
                <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{author ?? 'HR'} · {ago(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </Panel>
        <div className="space-y-6">
          <Panel title="Payslips" bodyClassName="p-0">
            <div id="payslips" />
            {visibleSlips.length ? (
              <ul className="divide-y">
                {visibleSlips.map(({ s, month }) => (
                  <li key={s.id}>
                    <details className="px-5 py-3">
                      <summary className="flex cursor-pointer items-center justify-between">
                        <span>{monthLabel(month)}</span>
                        <span className="tabular">{formatINR(s.net)}</span>
                      </summary>
                      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-sm tabular">
                        <dt className="text-muted-foreground">Basic</dt><dd className="text-right">{formatINR(s.basic)}</dd>
                        <dt className="text-muted-foreground">HRA</dt><dd className="text-right">{formatINR(s.hra)}</dd>
                        <dt className="text-muted-foreground">Allowances</dt><dd className="text-right">{formatINR(s.allowances)}</dd>
                        <dt className="border-t pt-1">Gross</dt><dd className="border-t pt-1 text-right">{formatINR(s.gross)}</dd>
                        <dt className="text-muted-foreground">Provident fund</dt><dd className="text-right">−{formatINR(s.pf)}</dd>
                        <dt className="text-muted-foreground">Professional tax</dt><dd className="text-right">−{formatINR(s.professionalTax)}</dd>
                        <dt className="text-muted-foreground">TDS</dt><dd className="text-right">−{formatINR(s.tds)}</dd>
                        {s.unpaidLeaveDeduction > 0 && (<><dt className="text-muted-foreground">Unpaid leave</dt><dd className="text-right">−{formatINR(s.unpaidLeaveDeduction)}</dd></>)}
                        <dt className="border-t pt-1 font-medium">Take-home</dt><dd className="border-t pt-1 text-right font-medium">{formatINR(s.net)}</dd>
                      </dl>
                    </details>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No payslips yet">They appear here once HR processes the month.</Empty>
            )}
          </Panel>
          <Panel title="Policies" bodyClassName="p-0">
            <ul className="divide-y">
              {policies.map((p) => (
                <li key={p.id}>
                  <details className="px-5 py-3">
                    <summary className="cursor-pointer">{p.title} <span className="text-sm text-muted-foreground">· {p.category}</span></summary>
                    <p className="mt-2 text-sm leading-relaxed">{p.body}</p>
                  </details>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
