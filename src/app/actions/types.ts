export type ActionState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string>; message?: string } | null

export function fieldErrors(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {}
  for (const i of issues) {
    const k = String(i.path[0] ?? 'form')
    if (!out[k]) out[k] = i.message
  }
  return out
}
