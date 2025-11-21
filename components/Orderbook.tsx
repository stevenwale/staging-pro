"use client"

import { useState } from "react"

interface Order {
  price: number
  size: number
  total: number
}

interface OrderbookData {
  bids: Order[]
  asks: Order[]
}

export function Orderbook() {
  const [activeTab, setActiveTab] = useState<"yes" | "no">("yes")

  // Yes orderbook data
  const [yesOrderbook, setYesOrderbook] = useState<OrderbookData>({
    bids: [
      { price: 0.65, size: 100, total: 100 },
      { price: 0.64, size: 150, total: 250 },
      { price: 0.63, size: 200, total: 450 },
      { price: 0.62, size: 120, total: 570 },
      { price: 0.61, size: 180, total: 750 },
    ],
    asks: [
      { price: 0.66, size: 100, total: 100 },
      { price: 0.67, size: 150, total: 250 },
      { price: 0.68, size: 200, total: 450 },
      { price: 0.69, size: 120, total: 570 },
      { price: 0.70, size: 180, total: 750 },
    ],
  })

  // No orderbook data
  const [noOrderbook, setNoOrderbook] = useState<OrderbookData>({
    bids: [
      { price: 0.30, size: 200, total: 200 },
      { price: 0.29, size: 180, total: 380 },
      { price: 0.28, size: 150, total: 530 },
      { price: 0.27, size: 220, total: 750 },
      { price: 0.26, size: 100, total: 850 },
    ],
    asks: [
      { price: 0.31, size: 200, total: 200 },
      { price: 0.32, size: 180, total: 380 },
      { price: 0.33, size: 150, total: 530 },
      { price: 0.34, size: 220, total: 750 },
      { price: 0.35, size: 100, total: 850 },
    ],
  })

  const currentOrderbook = activeTab === "yes" ? yesOrderbook : noOrderbook
  const { bids, asks } = currentOrderbook

  const maxTotal = Math.max(
    ...bids.map(b => b.total),
    ...asks.map(a => a.total)
  )

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/30 bg-black">
      <div className="border-b border-white/30">
        <div className="px-2 py-1">
          <h2>orderbook</h2>
        </div>
        <div className="flex border-t border-white/30">
          <button
            onClick={() => setActiveTab("yes")}
            className={`flex-1 px-2 flex items-center justify-center border-r border-white/30 text-sm font-medium transition-colors ${activeTab === "yes"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '32px' }}
          >
            Yes
          </button>
          <button
            onClick={() => setActiveTab("no")}
            className={`flex-1 px-2 flex items-center justify-center text-sm font-medium transition-colors ${activeTab === "no"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '32px' }}
          >
            No
          </button>
        </div>
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
                className="absolute left-0 top-0 h-full bg-red-500/40"
                style={{ width: `${(ask.total / maxTotal) * 100}%` }}
              />
              <div className="relative z-10 flex w-full items-center justify-between">
                <span className="text-red-500">{ask.price.toFixed(2)}</span>
                <span className="text-muted-foreground">{ask.size}</span>
                <span className="text-muted-foreground">{ask.total}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="border-y border-white/30 bg-muted/50 px-2 py-1 text-center text-sm font-medium">
          <div className="text-muted-foreground">
            Spread: {asks[0] && bids[0] ? (asks[0].price - bids[0].price).toFixed(4) : "0.0000"}
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
                className="absolute left-0 top-0 h-full bg-green-500/40"
                style={{ width: `${(bid.total / maxTotal) * 100}%` }}
              />
              <div className="relative z-10 flex w-full items-center justify-between">
                <span className="text-green-500">{bid.price.toFixed(2)}</span>
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

