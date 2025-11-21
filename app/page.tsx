"use client"

import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"

// Example query function
async function fetchExample() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts/1")
  if (!response.ok) {
    throw new Error("Failed to fetch")
  }
  return response.json()
}

export default function Home() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["example"],
    queryFn: fetchExample,
  })

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <main className="flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Next.js + Tailwind + shadcn/ui + TanStack Query
          </h1>
          <p className="text-lg text-muted-foreground">
            Your project is set up and ready to go!
          </p>
        </div>

        <div className="flex gap-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-2xl font-semibold">TanStack Query Example</h2>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {error && (
            <p className="text-destructive">Error: {error.message}</p>
          )}
          {data && (
            <div className="space-y-2">
              <p className="font-medium">{data.title}</p>
              <p className="text-sm text-muted-foreground">{data.body}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
