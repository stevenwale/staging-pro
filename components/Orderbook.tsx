"use client"

import { useState, useEffect, useRef } from "react"
import { Copy } from "lucide-react"
import { ClobClient } from "@polymarket/clob-client"
import { useLogs } from "@/lib/log-context"

interface Order {
  price: number
  size: number
  total: number
}

interface OrderbookData {
  bids: Order[]
  asks: Order[]
}

interface OrderbookUpdate {
  bids?: Array<[string, string]> // [price, size]
  asks?: Array<[string, string]> // [price, size]
}

interface OrderbookProps {
  wsUrl: string
}

// Helper function to serialize errors for logging
const serializeError = (error: unknown): string => {
  if (error instanceof Error) {
    const errorObj: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
    if (error.cause) {
      errorObj.cause = error.cause
    }
    return JSON.stringify(errorObj, null, 2)
  }
  if (typeof error === "object" && error !== null) {
    return JSON.stringify(error, null, 2)
  }
  return String(error)
}

export function Orderbook({ wsUrl }: OrderbookProps) {
  const { addLog } = useLogs()
  const [activeTab, setActiveTab] = useState<"yes" | "no">("yes")
  const [yesTokenId, setYesTokenId] = useState<string>("71321045679252212594626385532706912750332728571942532289631379312455583992563")
  const [noTokenId, setNoTokenId] = useState<string>("52114319501245915516055106046884209969926127482827954674443846427813813222426")

  // Yes orderbook data
  const [yesOrderbook, setYesOrderbook] = useState<OrderbookData>({
    bids: [],
    asks: [],
  })

  // No orderbook data
  const [noOrderbook, setNoOrderbook] = useState<OrderbookData>({
    bids: [],
    asks: [],
  })

  const wsRef = useRef<WebSocket | null>(null)
  const clobClientRef = useRef<ClobClient | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Initialize ClobClient and WebSocket connection
  useEffect(() => {
    const host = process.env.NEXT_PUBLIC_HTTP_URL || "https://clob.polymarket.com"
    clobClientRef.current = new ClobClient(host)

    // Close existing connection if URL changes
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    // Connect to WebSocket for orderbook updates using the URL from navbar
    if (!wsUrl || wsUrl.trim() === "") {
      addLog("WebSocket URL is empty", "error")
      setIsConnected(false)
      return
    }

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      addLog("WebSocket connected for orderbook updates", "connection")
      setIsConnected(true)

      // Subscribe to market channel with asset IDs
      const MARKET_CHANNEL = "market"
      const assetIds: string[] = []
      if (yesTokenId) assetIds.push(yesTokenId)
      if (noTokenId) assetIds.push(noTokenId)

      if (assetIds.length > 0) {
        const subscribeMessage = {
          assets_ids: assetIds,
          type: MARKET_CHANNEL
        }
        ws.send(JSON.stringify(subscribeMessage))
        addLog(`Subscribed to market channel: ${JSON.stringify(subscribeMessage)}`, "message")
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        // Add the response to logs
        addLog(`Orderbook response: ${JSON.stringify(data, null, 2)}`, "message")

        // Process orderbook update
        const processOrderbook = (bids: Array<[string, string]>, asks: Array<[string, string]>): OrderbookData => {
          // Convert bids to Order format and calculate totals
          const processedBids: Order[] = bids
            .map(([price, size]) => ({
              price: parseFloat(price),
              size: parseFloat(size),
              total: 0, // Will calculate below
            }))
            .sort((a, b) => b.price - a.price) // Sort descending (highest first)
            .map((order, index, arr) => {
              const total = index === 0
                ? order.size
                : arr[index - 1].total + order.size
              return { ...order, total }
            })

          // Convert asks to Order format and calculate totals
          const processedAsks: Order[] = asks
            .map(([price, size]) => ({
              price: parseFloat(price),
              size: parseFloat(size),
              total: 0, // Will calculate below
            }))
            .sort((a, b) => a.price - b.price) // Sort ascending (lowest first)
            .map((order, index, arr) => {
              const total = index === 0
                ? order.size
                : arr[index - 1].total + order.size
              return { ...order, total }
            })

          return { bids: processedBids, asks: processedAsks }
        }

        // Handle array format: [{ asset_id, bids, asks, event_type, ... }, ...]
        if (Array.isArray(data)) {
          data.forEach((item) => {
            if (item.event_type === "book" && item.asset_id) {
              const assetId = item.asset_id
              const bids = item.bids || []
              const asks = item.asks || []

              // Ensure bids and asks are in the correct format [price, size][]
              // If they're objects, convert them
              const formattedBids: Array<[string, string]> = bids.map((bid: any) => {
                if (Array.isArray(bid) && bid.length >= 2) {
                  return [String(bid[0]), String(bid[1])]
                } else if (typeof bid === "object" && bid !== null) {
                  return [String(bid.price || bid[0] || "0"), String(bid.size || bid[1] || "0")]
                }
                return ["0", "0"]
              })

              const formattedAsks: Array<[string, string]> = asks.map((ask: any) => {
                if (Array.isArray(ask) && ask.length >= 2) {
                  return [String(ask[0]), String(ask[1])]
                } else if (typeof ask === "object" && ask !== null) {
                  return [String(ask.price || ask[0] || "0"), String(ask.size || ask[1] || "0")]
                }
                return ["0", "0"]
              })

              const orderbookData = processOrderbook(formattedBids, formattedAsks)

              if (assetId === yesTokenId) {
                setYesOrderbook(orderbookData)
              } else if (assetId === noTokenId) {
                setNoOrderbook(orderbookData)
              }
            }
          })
        }
        // Handle different message formats (legacy support)
        // Format 1: { channel: "orderbook", data: { bids: [...], asks: [...] }, token_id: "..." }
        else if (data.channel === "orderbook" || data.event === "orderbook") {
          const tokenId = data.token_id || data.tokenId || data.params?.[0]?.replace("orderbook.", "")
          const update: OrderbookUpdate = data.data || data

          if (update.bids || update.asks) {
            const orderbookData = processOrderbook(
              update.bids || [],
              update.asks || []
            )

            if (tokenId === yesTokenId) {
              setYesOrderbook(orderbookData)
            } else if (tokenId === noTokenId) {
              setNoOrderbook(orderbookData)
            }
          }
        }
        // Format 2: Direct orderbook update { bids: [...], asks: [...] }
        else if (data.bids || data.asks) {
          // Try to determine token ID from subscription params or message
          const tokenId = data.token_id || data.tokenId || data.asset_id
          const orderbookData = processOrderbook(
            data.bids || [],
            data.asks || []
          )

          // Update both if we can't determine which token, or update specific one
          if (tokenId === yesTokenId) {
            setYesOrderbook(orderbookData)
          } else if (tokenId === noTokenId) {
            setNoOrderbook(orderbookData)
          } else if (!tokenId) {
            // If no token ID specified, update the active tab's orderbook
            if (activeTab === "yes") {
              setYesOrderbook(orderbookData)
            } else {
              setNoOrderbook(orderbookData)
            }
          }
        }
        // Format 3: Response to subscription { result: { bids: [...], asks: [...] } }
        else if (data.result && (data.result.bids || data.result.asks)) {
          const orderbookData = processOrderbook(
            data.result.bids || [],
            data.result.asks || []
          )
          // Update active tab's orderbook
          if (activeTab === "yes") {
            setYesOrderbook(orderbookData)
          } else {
            setNoOrderbook(orderbookData)
          }
        }
      } catch (error) {
        const errorMessage = `Error parsing orderbook update: ${serializeError(error)}`
        addLog(errorMessage, "error")
      }
    }

    ws.onerror = (error) => {
      const errorMessage = `WebSocket error: ${serializeError(error)}`
      addLog(errorMessage, "error")
      setIsConnected(false)
    }

    ws.onclose = () => {
      addLog("WebSocket closed, attempting to reconnect...", "connection")
      setIsConnected(false)
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          // Reconnection will be handled by the effect
        }
      }, 3000)
    }

    wsRef.current = ws

    return () => {
      if (wsRef.current) {
        // Unsubscribe before closing if connection is open
        if (wsRef.current.readyState === WebSocket.OPEN) {
          if (yesTokenId) {
            try {
              wsRef.current.send(JSON.stringify({
                method: "unsubscribe",
                params: [`orderbook.${yesTokenId}`]
              }))
            } catch (error) {
              addLog(`Error unsubscribing from yes token: ${serializeError(error)}`, "error")
            }
          }
          if (noTokenId) {
            try {
              wsRef.current.send(JSON.stringify({
                method: "unsubscribe",
                params: [`orderbook.${noTokenId}`]
              }))
            } catch (error) {
              addLog(`Error unsubscribing from no token: ${serializeError(error)}`, "error")
            }
          }
        }
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [yesTokenId, noTokenId, wsUrl, addLog])

  // Resubscribe when token IDs change
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      // Subscribe to market channel with asset IDs
      const MARKET_CHANNEL = "market"
      const assetIds: string[] = []
      if (yesTokenId) assetIds.push(yesTokenId)
      if (noTokenId) assetIds.push(noTokenId)

      if (assetIds.length > 0) {
        const subscribeMessage = {
          assets_ids: assetIds,
          type: MARKET_CHANNEL
        }
        wsRef.current.send(JSON.stringify(subscribeMessage))
        addLog(`Resubscribed to market channel: ${JSON.stringify(subscribeMessage)}`, "message")
      }
    }
  }, [yesTokenId, noTokenId, addLog])

  const currentOrderbook = activeTab === "yes" ? yesOrderbook : noOrderbook
  const { bids, asks } = currentOrderbook

  // Sort asks in descending order (highest price first)
  const sortedAsks = [...asks].sort((a, b) => b.price - a.price)

  // Always show exactly 8 levels on each side, pad with empty if needed
  const limitedBids: (Order | null)[] = [...bids.slice(0, 8)]
  const limitedAsks: (Order | null)[] = [...sortedAsks.slice(0, 8)]

  // Pad to exactly 8 rows
  // Bids: pad at the bottom (push)
  while (limitedBids.length < 8) {
    limitedBids.push(null)
  }
  // Asks: pad at the top (unshift) so empty rows appear at the top
  while (limitedAsks.length < 8) {
    limitedAsks.unshift(null)
  }

  const maxTotal = Math.max(
    ...limitedBids.filter(b => b !== null).map(b => b.total),
    ...limitedAsks.filter(a => a !== null).map(a => a.total),
    1 // fallback to 1 to avoid division by zero
  )

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", serializeError(err))
    }
  }

  return (
    <div className="flex h-full flex-col rounded-sm border border-white/30 bg-black">
      <div className="border-b border-white/30">
        <div className="px-1 py-0.5 flex items-center justify-between">
          <h2 className="text-xs">orderbook</h2>
          <div className="flex items-center gap-1">
            <div
              className={`h-1.5 w-1.5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
        <div className="px-1 py-1 space-y-1 border-t border-white/30">
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-3">Y</label>
            <input
              type="text"
              value={yesTokenId}
              onChange={(e) => setYesTokenId(e.target.value)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => copyToClipboard(yesTokenId)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-3">N</label>
            <input
              type="text"
              value={noTokenId}
              onChange={(e) => setNoTokenId(e.target.value)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => copyToClipboard(noTokenId)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
        <div className="flex border-t border-white/30">
          <button
            onClick={() => setActiveTab("yes")}
            className={`flex-1 px-1 flex items-center justify-center border-r border-white/30 text-xs font-medium transition-colors ${activeTab === "yes"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '24px' }}
          >
            Yes
          </button>
          <button
            onClick={() => setActiveTab("no")}
            className={`flex-1 px-1 flex items-center justify-center text-xs font-medium transition-colors ${activeTab === "no"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '24px' }}
          >
            No
          </button>
        </div>
      </div>
      <div className="flex-shrink-0 overflow-x-auto">
        {/* Asks (Sell Orders) */}
        <div className="space-y-0 min-w-max">
          {limitedAsks.map((ask, index) => (
            <div
              key={`ask-${index}`}
              className="relative flex items-center justify-between px-1 py-0.5 text-xs hover:bg-accent"
            >
              {ask && (
                <div
                  className="absolute left-0 top-0 h-full bg-red-500/40"
                  style={{ width: `${(ask.total / maxTotal) * 100}%` }}
                />
              )}
              <div className="relative z-10 flex w-full items-center justify-between gap-2 whitespace-nowrap">
                {ask ? (
                  <>
                    <span className="text-red-500">{ask.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">{ask.size}</span>
                    <span className="text-muted-foreground">{ask.total}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">—</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="border-y border-white/30 bg-muted/50 px-1 py-0.5 text-center text-xs font-medium">
          <div className="text-muted-foreground">
            Spread: {limitedAsks[0] && limitedBids[0] && limitedAsks[0] !== null && limitedBids[0] !== null ? (limitedAsks[0].price - limitedBids[0].price).toFixed(4) : "0.0000"}
          </div>
        </div>

        {/* Bids (Buy Orders) */}
        <div className="space-y-0">
          {limitedBids.map((bid, index) => (
            <div
              key={`bid-${index}`}
              className="relative flex items-center justify-between px-1 py-0.5 text-xs hover:bg-accent"
            >
              {bid && (
                <div
                  className="absolute left-0 top-0 h-full bg-green-500/40"
                  style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                />
              )}
              <div className="relative z-10 flex w-full items-center justify-between gap-2 whitespace-nowrap">
                {bid ? (
                  <>
                    <span className="text-green-500">{bid.price.toFixed(2)}</span>
                    <span className="text-muted-foreground">{bid.size}</span>
                    <span className="text-muted-foreground">{bid.total}</span>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">—</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

