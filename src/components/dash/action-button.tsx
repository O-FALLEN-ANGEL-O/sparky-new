'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

/** Runs a server action, shows its error inline, and refreshes the page on success. */
export function ActionButton({
  action,
  confirm,
  children,
  pendingText,
  ...props
}: Omit<ButtonProps, 'onClick' | 'action'> & { action: () => Promise<{ error?: string; message?: string } | void>; confirm?: string; pendingText?: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [asking, setAsking] = useState(false)
  const router = useRouter()
  const run = () =>
    start(async () => {
      setError('')
      const r = await action()
      if (r && 'error' in r && r.error) setError(r.error)
      setAsking(false)
      router.refresh()
    })
  if (asking) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2 text-sm">
        <span>{confirm}</span>
        <Button size="sm" variant={props.variant === 'destructive' ? 'destructive' : 'default'} disabled={pending} onClick={run}>{pending ? pendingText ?? 'Working…' : 'Yes'}</Button>
        <Button size="sm" variant="ghost" onClick={() => setAsking(false)}>No</Button>
      </span>
    )
  }
  return (
    <span className="inline-flex flex-col gap-1">
      <Button {...props} disabled={pending || props.disabled} onClick={() => (confirm ? setAsking(true) : run())}>
        {pending ? pendingText ?? 'Working…' : children}
      </Button>
      {error && <span className="text-xs text-kumkum" role="alert">{error}</span>}
    </span>
  )
}
