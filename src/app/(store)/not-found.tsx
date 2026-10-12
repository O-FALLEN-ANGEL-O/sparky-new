import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container max-w-xl py-24 text-center">
      <h1 className="text-5xl">We couldn’t find that page</h1>
      <p className="mt-4 text-muted-foreground">The piece may have sold out or the link may be old.</p>
      <Link href="/shop" className="mt-8 inline-block underline underline-offset-4">Browse the collection</Link>
    </div>
  )
}
