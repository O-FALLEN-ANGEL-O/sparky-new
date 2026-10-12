'use client'

import { useActionState } from 'react'
import { changePassword, updateProfile } from '@/app/actions/auth'
import { Field, FormMessage, Submit } from '@/components/forms'

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action] = useActionState(updateProfile, null)
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Email" name="email" value={email} disabled readOnly hint="Contact us to change the email on your account." />
      <Field label="Full name" name="name" defaultValue={name} error={state?.fieldErrors?.name} />
      <Field label="Mobile number" name="phone" type="tel" maxLength={10} defaultValue={phone} error={state?.fieldErrors?.phone} />
      <Submit>Save profile</Submit>
    </form>
  )
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null)
  return (
    <form action={action} className="max-w-md space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Current password" name="current" type="password" autoComplete="current-password" error={state?.fieldErrors?.current} />
      <Field label="New password" name="next" type="password" autoComplete="new-password" error={state?.fieldErrors?.next} hint="At least 8 characters with a number." />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" error={state?.fieldErrors?.confirm} />
      <Submit>Change password</Submit>
    </form>
  )
}
