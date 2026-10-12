import { desc, eq, ne } from 'drizzle-orm'
import { alias } from 'drizzle-orm/sqlite-core'
import { cancelLeave } from '@/app/actions/people'
import { ActionButton } from '@/components/dash/action-button'
import { BarList, Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { dateShort } from '@/lib/format'
import { LEAVE_LABEL } from '@/lib/leave'
import { can } from '@/lib/roles'
import { requireUser } from '@/lib/server/auth'
import { leaveBalance, pendingLeave } from '@/lib/server/people'
import { LeaveForm, Review } from './leave-ui'

export const metadata = { title: 'Leave' }
const requester = alias(schema.users, 'requester')
const reviewer = alias(schema.users, 'reviewer')
const TONE = { pending: 'gold', approved: 'ok', rejected: 'danger', cancelled: 'neutral' } as const

export default async function Leave({ searchParams }: { searchParams: Promise<{ new?: string }> }) {
  const me = await requireUser()
  const own = can(me.role, 'leave.own')
  const approver = can(me.role, 'leave.approve')
  const [balance, mine, queue, history] = await Promise.all([
    own ? leaveBalance(me.id) : [],
    own ? db.select({ l: schema.leaveRequests, by: reviewer.name }).from(schema.leaveRequests).leftJoin(reviewer, eq(reviewer.id, schema.leaveRequests.reviewerId)).where(eq(schema.leaveRequests.userId, me.id)).orderBy(desc(schema.leaveRequests.startDate)) : [],
    approver ? pendingLeave(me.role === 'manager' ? me.id : undefined) : [],
    approver
      ? db.select({ l: schema.leaveRequests, name: requester.name, by: reviewer.name }).from(schema.leaveRequests).innerJoin(requester, eq(requester.id, schema.leaveRequests.userId)).leftJoin(reviewer, eq(reviewer.id, schema.leaveRequests.reviewerId)).where(ne(schema.leaveRequests.status, 'pending')).orderBy(desc(schema.leaveRequests.reviewedAt)).limit(12)
      : [],
  ])
  return (
    <div className="space-y-6">
      <PageHeader title="Leave" description="Casual 12, sick 10 and earned 15 days a year. Unpaid leave is deducted in payroll." />
      {own && (
        <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
          <Panel title="Days left this year">
            <BarList rows={balance.filter((b) => b.allowance).map((b) => ({ label: LEAVE_LABEL[b.type], value: b.left, sub: `of ${b.allowance}` }))} format={(n) => `${n} days`} max={15} />
          </Panel>
          <div className="space-y-4">
            <LeaveForm startOpen={(await searchParams).new === '1'} />
            <Panel title="My requests" bodyClassName="p-0">
              {mine.length ? (
                <ul className="divide-y">
                  {mine.map(({ l, by }) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-[15px]">
                      <span className="flex-1">{LEAVE_LABEL[l.type]}, {dateShort(l.startDate)} – {dateShort(l.endDate)} <span className="text-muted-foreground">({l.days} day{l.days === 1 ? '' : 's'})</span>
                        {l.reviewNote && <span className="block text-sm text-muted-foreground">“{l.reviewNote}” — {by}</span>}
                      </span>
                      <Pill tone={TONE[l.status]}>{l.status}</Pill>
                      {l.status === 'pending' && <ActionButton size="sm" variant="ghost" action={cancelLeave.bind(null, l.id)}>Withdraw</ActionButton>}
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty title="No leave requested yet" />
              )}
            </Panel>
          </div>
        </div>
      )}
      {approver && (
        <>
          <Panel title={`Waiting for a decision (${queue.length})`} description={me.role === 'manager' ? 'From your team' : 'From everyone'} bodyClassName="p-0">
            {queue.length ? (
              <ul className="divide-y">
                {queue.map(({ leave: l, name, title }) => (
                  <li key={l.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_20rem] md:items-center">
                    <div>
                      <p className="font-medium">{name} <span className="font-normal text-muted-foreground">· {title}</span></p>
                      <p className="text-[15px]">{LEAVE_LABEL[l.type]} leave, {dateShort(l.startDate)} – {dateShort(l.endDate)} ({l.days} day{l.days === 1 ? '' : 's'})</p>
                      <p className="text-sm text-muted-foreground">“{l.reason}”</p>
                    </div>
                    {l.userId === me.id ? <p className="text-sm text-muted-foreground">Your own request — someone else reviews it.</p> : <Review id={l.id} />}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="Nothing to review" />
            )}
          </Panel>
          <Panel title="Recently decided" bodyClassName="p-0">
            <ul className="divide-y">
              {history.map(({ l, name, by }) => (
                <li key={l.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <span className="flex-1">{name}: {LEAVE_LABEL[l.type]}, {dateShort(l.startDate)} – {dateShort(l.endDate)}</span>
                  <span className="text-muted-foreground">{by}</span>
                  <Pill tone={TONE[l.status]}>{l.status}</Pill>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  )
}
