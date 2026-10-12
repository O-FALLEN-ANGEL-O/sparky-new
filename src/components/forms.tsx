'use client'

import { useFormStatus } from 'react-dom'
import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Field({
  label,
  name,
  error,
  hint,
  className,
  children,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string; hint?: string; children?: React.ReactNode }) {
  const id = input.id ?? `f-${name}`
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children ?? (
        <input
          id={id}
          name={name}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(
            'h-11 w-full border bg-background px-3 text-[15px] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground',
            error && 'border-kumkum',
          )}
          {...input}
        />
      )}
      {error ? (
        <p id={`${id}-err`} className="text-sm text-kumkum">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function Submit({ children, pendingText, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending || props.disabled} {...props}>
      {pending ? pendingText ?? 'Saving…' : children}
    </Button>
  )
}

export function FormMessage({ state }: { state: { error?: string; message?: string; ok?: boolean } | null | undefined }) {
  if (!state) return null
  if (state.error) return <p role="alert" className="border-l-2 border-kumkum bg-kumkum/5 px-3 py-2 text-sm text-kumkum">{state.error}</p>
  if (state.ok && state.message) return <p role="status" className="border-l-2 border-ok bg-ok/5 px-3 py-2 text-sm text-ok">{state.message}</p>
  return null
}
