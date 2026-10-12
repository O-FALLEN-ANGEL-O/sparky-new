export const JOB_TYPE: Record<string, string> = { full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship' }

export const APPLICATION_STAGES = [
  ['new', 'New'],
  ['reviewing', 'Reviewing'],
  ['interview', 'Interview'],
  ['offer', 'Offer'],
  ['hired', 'Hired'],
  ['rejected', 'Not progressing'],
] as const
