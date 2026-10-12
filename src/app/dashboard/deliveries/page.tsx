import Link from 'next/link'
import { desc, eq, inArray } from 'drizzle-orm'
import { AssignSelect } from '@/components/dash/assign-select'
import { Empty, PageHeader, Panel, Pill } from '@/components/dash/ui'
import { db, schema } from '@/db'
import { ago, dateTime } from '@/lib/format'
import { DELIVERY_STATUS_LABEL } from '@/lib/order-status'
import { requireUser } from '@/lib/server/auth'
import { agentLoad, deliveryAgents } from '@/lib/server/people'

export const metadata = { title: 'Deliveries' }

export default async function Deliveries() {
  await requireUser({ permission: 'deliveries.manage' })
  const base = () => db
    .select({ d: schema.deliveries, number: schema.orders.number, address: schema.orders.shippingAddress, orderStatus: schema.orders.status, agent: schema.users.name })
    .from(schema.deliveries)
    .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
    .leftJoin(schema.users, eq(schema.users.id, schema.deliveries.agentId))
  const [queue, active, done, agents, load] = await Promise.all([
    base().where(eq(schema.deliveries.status, 'pending')).orderBy(schema.deliveries.updatedAt),
    base().where(inArray(schema.deliveries.status, ['assigned', 'accepted', 'out_for_delivery'])).orderBy(desc(schema.deliveries.updatedAt)),
    base().where(eq(schema.deliveries.status, 'delivered')).orderBy(desc(schema.deliveries.deliveredAt)).limit(10),
    deliveryAgents(),
    agentLoad(),
  ])
  const agentList = agents.map((a) => ({ ...a, load: load.get(a.id) ?? 0 }))
  return (
    <div className="space-y-6">
      <PageHeader title="Deliveries" description="Assign each paid order to a partner. They complete the handover with the customer’s 6-digit code." />
      <div className="grid gap-3 sm:grid-cols-3">
        {agentList.map((a) => (
          <div key={a.id} className="rounded-lg border bg-card p-4">
            <p className="font-medium">{a.name}</p>
            <p className="text-sm text-muted-foreground">{a.phone}</p>
            <p className="mt-2 text-sm"><span className="font-headline text-2xl tabular">{a.load}</span> active deliveries</p>
          </div>
        ))}
      </div>
      <Panel title="Waiting for a partner" description="Oldest first" bodyClassName="p-0">
        {queue.length ? (
          <ul className="divide-y">
            {queue.map(({ d, number, address }) => (
              <li key={d.id} className="grid gap-3 px-5 py-3 sm:grid-cols-[8rem_1fr_14rem] sm:items-center">
                <Link href={`/dashboard/orders/${number}`} className="font-medium underline-offset-4 hover:underline">{number}</Link>
                <span className="text-sm">{address.name}, {address.city} {address.pincode}<span className="block text-muted-foreground">waiting {ago(d.updatedAt)}</span></span>
                <AssignSelect orderId={d.orderId} agents={agentList} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Every order has a partner" />
        )}
      </Panel>
      <Panel title="In progress" bodyClassName="p-0">
        {active.length ? (
          <ul className="divide-y">
            {active.map(({ d, number, address, agent }) => (
              <li key={d.id} className="grid gap-2 px-5 py-3 sm:grid-cols-[8rem_1fr_10rem_9rem] sm:items-center">
                <Link href={`/dashboard/orders/${number}`} className="font-medium underline-offset-4 hover:underline">{number}</Link>
                <span className="text-sm">{address.city} · {address.name}</span>
                <span className="text-sm">{agent}</span>
                <Pill tone={d.status === 'out_for_delivery' ? 'blue' : 'gold'}>{DELIVERY_STATUS_LABEL[d.status]}</Pill>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Nothing on the road" />
        )}
      </Panel>
      <Panel title="Recently delivered" bodyClassName="p-0">
        <ul className="divide-y">
          {done.map(({ d, number, address, agent }) => (
            <li key={d.id} className="grid gap-2 px-5 py-3 text-sm sm:grid-cols-[8rem_1fr_10rem_10rem]">
              <Link href={`/dashboard/orders/${number}`} className="font-medium underline-offset-4 hover:underline">{number}</Link>
              <span>{address.city}</span>
              <span>{agent}</span>
              <span className="text-muted-foreground">{d.deliveredAt ? dateTime(d.deliveredAt) : ''}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}
