import type { Metadata } from 'next'
import { asc, desc, eq } from 'drizzle-orm'
import { db, schema } from '@/db'
import { requireUser } from '@/lib/server/auth'
import { AddressActions, NewAddress } from './address-ui'

export const metadata: Metadata = { title: 'Addresses' }

export default async function Addresses() {
  const user = await requireUser()
  const rows = await db.select().from(schema.addresses).where(eq(schema.addresses.userId, user.id)).orderBy(desc(schema.addresses.isDefault), asc(schema.addresses.id))
  return (
    <div className="space-y-6">
      <h2 className="text-3xl">Addresses</h2>
      <ul className="grid gap-4 sm:grid-cols-2">
        {rows.map((a) => (
          <li key={a.id} className="space-y-3 border p-5">
            <p className="leading-relaxed">
              <span className="font-medium">{a.name}</span>
              {a.isDefault && <span className="ml-2 text-xs text-muted-foreground">Default</span>}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ''}
              <br />
              {a.city}, {a.state} {a.pincode}
              <br />
              {a.phone}
            </p>
            <AddressActions id={a.id} isDefault={a.isDefault} />
          </li>
        ))}
      </ul>
      {!rows.length && <p className="text-muted-foreground">No saved addresses yet. Add one now, or at checkout.</p>}
      <NewAddress />
    </div>
  )
}
