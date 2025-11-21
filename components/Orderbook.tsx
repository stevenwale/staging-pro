"use client"

import { useState } from "react"

interface Order {
  price: number
  size: number
  total: number
}

export function Orderbook() {
  const [bids, setBids] = useState<Order[]>([
    { price: 0.65, size: 100, total: 100 },
    { price: 0.64, size: 150, total: 250 },
    { price: 0.63, size: 200, total: 450 },
    { price: 0.62, size: 120, total: 570 },
    { price: 0.61, size: 180, total: 750 },
  ])

  const [asks, setAsks] = useState<Order[]>([
    { price: 0.66, size: 100, total: 100 },
    { price: 0.67, size: 150, total: 250 },
    { price: 0.68, size: 200, total: 450 },
    { price: 0.69, size: 120, total: 570 },
    { price: 0.70, size: 180, total: 750 },
  ])

  const maxTotal = Math.max(
    ...bids.map(b => b.total),
    ...asks.map(a => a.total)
  )

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="border-b px-2 py-1">
        <h2 className="text-lg font-semibold">orderbook</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {/* Asks (Sell Orders) */}
        <div className="space-y-0">
          {asks.map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="relative flex items-center justify-between px-2 py-0.5 text-sm hover:bg-accent"
            >
              <div
                className="absolute left-0 top-0 h-full bg-destructive/20"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <div className="relative z-10 flex w-full items-center justify-between">
                <span className="text-destructive">{ask.price.toFixed(2)}</span>
                <span className="text-muted-foreground">{ask.size}</span>
                <span className="text-muted-foreground">{ask.total}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="border-y bg-muted/50 px-2 py-1 text-center text-sm font-medium">
          <div className="text-muted-foreground">
            Spread: {(asks[0]?.price - bids[0]?.price).toFixed(4)}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-0">
          {bids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="relative flex items-center justify-between px-2 py-0.5 text-sm hover:bg-accent"
            >
              <div
                className="absolute right-0 top-0 h-full bg-primary/20"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="relative z-10 flex w-full items-center justify-between">
                <span className="text-primary">{bid.price.toFixed(2)}</span>
                <span className="text-muted-foreground">{bid.size}</span>
                <span className="text-muted-foreground">{bid.total}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

