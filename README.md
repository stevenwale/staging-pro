# Staging Pro

A Next.js 16 project with TypeScript, Tailwind CSS v4, shadcn/ui, and TanStack Query.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React version
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **TanStack Query** - Powerful data synchronization for React

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions and providers
└── public/          # Static assets
```

## Adding shadcn/ui Components

To add new shadcn/ui components, use the CLI:

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add card
npx shadcn@latest add input
```

## Using TanStack Query

The `QueryClientProvider` is already set up in `lib/providers.tsx` and wrapped around your app in `app/layout.tsx`.

Example usage:
```tsx
"use client"

import { useQuery } from "@tanstack/react-query"

export function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ["myData"],
    queryFn: async () => {
      const res = await fetch("/api/data")
      return res.json()
    },
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{data}</div>
}
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
