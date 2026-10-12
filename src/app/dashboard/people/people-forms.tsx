'use client'

import { useActionState, useState } from 'react'
import { addStaff, updateStaff } from '@/app/actions/staff'
import { Field, FormMessage, Submit } from '@/components/forms'
import { Button } from '@/components/ui/button'

type Opt = { value: string; label: string }
const ROLES: Opt[] = [
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
  { value: 'admin', label: 'Admin' },
  { value: 'delivery_agent', label: 'Delivery partner' },
  { value: 'shareholder', label: 'Shareholder' },
]

function Select({ name, label, options, defaultValue, error }: { name: string; label: string; options: Opt[]; defaultValue?: string; error?: string }) {
  return (
    <Field label={label} name={name} error={error}>
      <select id={`f-${name}`} name={name} defaultValue={defaultValue} className="h-11 w-full border bg-background px-3 text-[15px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </Field>
  )
}

export function AddStaffForm({ managers }: { managers: Opt[] }) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(addStaff, null)
  const e = state?.fieldErrors ?? {}
  if (!open) return <Button onClick={() => setOpen(true)}>Add a person</Button>
  return (
    <form action={action} className="grid gap-4 rounded-lg border bg-card p-5 md:grid-cols-3" noValidate>
      <div className="md:col-span-3"><FormMessage state={state} /></div>
      <Field label="Full name" name="name" error={e.name} />
      <Field label="Work email" name="email" type="email" error={e.email} />
      <Field label="Mobile" name="phone" type="tel" maxLength={10} error={e.phone} />
      <Select name="role" label="Role" options={ROLES} defaultValue="employee" />
      <Field label="Department" name="department" error={e.department} />
      <Field label="Job title" name="title" error={e.title} />
      <Select name="managerId" label="Reports to" options={[{ value: '', label: 'Nobody' }, ...managers]} />
      <Field label="Joining date" name="joinDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} error={e.joinDate} />
      <Field label="Monthly salary (₹)" name="monthlySalary" type="number" defaultValue={0} error={e.monthlySalary} />
      <Field label="Location" name="location" defaultValue="Mangaluru" />
      <div className="flex items-end gap-2 md:col-span-2">
        <Submit>Add and start onboarding</Submit>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </form>
  )
}

export function EditPerson({ person, managers, canRole, canDetails }: {
  person: { id: number; role: string; department: string; title: string; salary: number; managerId: number | null }
  managers: Opt[]
  canRole: boolean
  canDetails: boolean
}) {
  const [state, action] = useActionState(updateStaff, null)
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2" noValidate>
      <input type="hidden" name="id" value={person.id} />
      <div className="sm:col-span-2"><FormMessage state={state} /></div>
      {canRole && person.role !== 'owner' && <Select name="role" label="Role" options={ROLES} defaultValue={person.role} />}
      {canDetails && (
        <>
          <Field label="Department" name="department" defaultValue={person.department} />
          <Field label="Job title" name="title" defaultValue={person.title} />
          <Field label="Monthly salary (₹)" name="monthlySalary" type="number" defaultValue={person.salary} />
          <Select name="managerId" label="Reports to" options={[{ value: '', label: 'Nobody' }, ...managers.filter((m) => m.value !== String(person.id))]} defaultValue={person.managerId ? String(person.managerId) : ''} />
        </>
      )}
      <div className="sm:col-span-2"><Submit size="sm">Save</Submit></div>
    </form>
  )
}
