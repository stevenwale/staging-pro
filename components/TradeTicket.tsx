"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Copy, Eye, EyeOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogs } from "@/lib/log-context"
import { useLocalStorage } from "@/lib/use-local-storage"
import { formatDateTime } from "@/lib/utils"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import { ClobClient, Side, OrderType as ClobOrderType } from "@polymarket/clob-client"
import { Wallet } from "@ethersproject/wallet"

type OrderType = "buy" | "sell"
type OrderSide = "yes" | "no"
type TimeInForce = "GTC" | "FOK" | "FAK" | "GTD"

interface Order {
  id: string
  type: OrderType
  side: OrderSide
  price: number
  size: number
  tif: TimeInForce

  timestamp: string
  status: string
}

interface Trade {
  id: string
  side: "buy" | "sell"
  asset_id: string
  outcome: string
  price: number
  size: number
  timestamp: string
  order_id: string
}

interface OrdersTableProps {
  orders: Order[]
  onCancel: (orderId: string) => Promise<void>
  onCancelAll: () => Promise<void>
}

interface TradesTableProps {
  trades: Trade[]
}

function TradesTable({ trades }: TradesTableProps) {
  const columns = useMemo<ColumnDef<Trade>[]>(
    () => [
      {
        accessorKey: "asset_id",
        header: "Asset ID",
        cell: (info) => {
          const assetId = String(info.getValue())
          // Extract only digits and take first 8
          const digits = assetId.replace(/\D/g, '').slice(0, 8)
          return (
            <span className="text-muted-foreground text-[10px] font-mono">
              {digits}
            </span>
          )
        },
      },
      {
        accessorKey: "side",
        header: "Side",
        cell: (info) => {
          const side = info.getValue() as "buy" | "sell"
          return (
            <span className={`font-medium ${side === "buy" ? "text-green-400" : "text-red-400"}`}>
              {side.toUpperCase()}
            </span>
          )
        },
      },
      {
        accessorKey: "outcome",
        header: "Outcome",
        cell: (info) => (
          <span className="text-muted-foreground">
            {(info.getValue() as string).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        cell: (info) => (
          <span className="text-muted-foreground">
            {formatDateTime(info.getValue() as string)}
          </span>
        ),
      },
    ],
    []
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: trades,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (trades.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        No trades yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-black orders-scrollbar">
      <table className="w-full text-[11px] min-w-max">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/30">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-2 py-1 text-left text-[11px] text-muted-foreground font-medium whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/10 hover:bg-white/5"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 whitespace-nowrap text-left">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrdersTable({ orders, onCancel, onCancelAll }: OrdersTableProps) {
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: (info) => {
          const type = info.getValue() as OrderType
          return (
            <span
              className={`font-medium ${type === "buy" ? "text-green-400" : "text-red-400"
                }`}
            >
              {type.toUpperCase()}
            </span>
          )
        },
      },
      {
        accessorKey: "side",
        header: "Side",
        cell: (info) => (
          <span className="text-muted-foreground">
            {(info.getValue() as OrderSide).toUpperCase()}
          </span>
        ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: "size",
        header: "Size",
        cell: (info) => (info.getValue() as number).toFixed(2),
      },
      {
        accessorKey: "tif",
        header: "TIF",
        cell: (info) => info.getValue() as string,
      },
      {
        accessorKey: "timestamp",
        header: "Time",
        cell: (info) => (
          <span className="text-muted-foreground">
            {formatDateTime(info.getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="flex justify-end">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCancelAll()
              }}
              className="text-[10px] text-red-500 hover:text-red-400 hover:bg-white/10 active:opacity-50 transition-colors rounded px-1 py-0.5 font-medium uppercase"
              title="Clear all orders"
            >
              Clear
            </button>
          </div>
        ),
        cell: (info) => {
          const order = info.row.original
          return (
            <div className="flex justify-end">
              <button
                onClick={() => onCancel(order.id)}
                className="p-0.5 text-muted-foreground hover:text-white hover:bg-white/10 hover:opacity-70 active:opacity-50 transition-colors rounded"
                title="Cancel order"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )
        },
      },
    ],
    [onCancel, onCancelAll]
  )

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (orders.length === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4">
        No orders yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto bg-black orders-scrollbar">
      <table className="w-full text-[11px] min-w-max">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-white/30">
              {headerGroup.headers.map((header) => {
                const isActionsColumn = header.column.id === "actions"
                return (
                  <th
                    key={header.id}
                    className={`${isActionsColumn ? "px-1 w-20" : "px-2"} py-1 ${isActionsColumn ? "text-right" : "text-left"} text-[11px] text-muted-foreground font-medium whitespace-nowrap`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b border-white/10 hover:bg-white/5"
            >
              {row.getVisibleCells().map((cell) => {
                const isActionsColumn = cell.column.id === "actions"
                return (
                  <td key={cell.id} className={`${isActionsColumn ? "px-1 w-20" : "px-2"} py-1 whitespace-nowrap ${isActionsColumn ? "text-right" : "text-left"}`}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


interface TradeTicketProps {
  defaultAddress?: string
  defaultPk?: string
  defaultClobApiKey?: string
  defaultClobSecret?: string
  defaultClobPassPhrase?: string
  storageKey?: string // Optional key to differentiate multiple TradeTicket instances
}

export function TradeTicket({
  defaultAddress = "0xFeA4cB3dD4ca7CefD3368653B7D6FF9BcDFca604",
  defaultPk = "79eb3f434fe848db33e1f86107a407a01d1dd18c5da4b03d674a47a5499380c7",
  defaultClobApiKey = "b349bff6-7af8-0470-ed25-22a2a5e1c154",
  defaultClobSecret = "qXRtb5OefyuZdv9A4lZ3JAaoBn1-JTZJ7KKQ63jstqY=",
  defaultClobPassPhrase = "2cd4e53cbde7caf0771a5ea0669c2b67f7fa962d5d8c8c241564fd7ece626ade",
  storageKey = "tradeticket",
}: TradeTicketProps = {}) {
  const { addLog } = useLogs()
  const [orderType, setOrderType] = useLocalStorage<OrderType>(`${storageKey}_orderType`, "buy")
  const [orderSide, setOrderSide] = useLocalStorage<OrderSide>(`${storageKey}_orderSide`, "yes")
  const [price, setPrice] = useLocalStorage<string>(`${storageKey}_price`, "")
  const [size, setSize] = useLocalStorage<string>(`${storageKey}_size`, "")
  const [tif, setTif] = useLocalStorage<TimeInForce>(`${storageKey}_tif`, "GTC")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [activeTab, setActiveTab] = useLocalStorage<"trades" | "orders">(`${storageKey}_activeTab`, "orders")

  // Trade settings
  const [address, setAddress] = useLocalStorage<string>(`${storageKey}_address`, defaultAddress)
  const [pk, setPk] = useLocalStorage<string>(`${storageKey}_pk`, defaultPk)
  const [clobApiKey, setClobApiKey] = useLocalStorage<string>(`${storageKey}_clobApiKey`, defaultClobApiKey)
  const [clobSecret, setClobSecret] = useLocalStorage<string>(`${storageKey}_clobSecret`, defaultClobSecret)
  const [clobPassPhrase, setClobPassPhrase] = useLocalStorage<string>(`${storageKey}_clobPassPhrase`, defaultClobPassPhrase)

  // Get token IDs from orderbook localStorage (for order submission)
  const yesTokenId = useLocalStorage<string>("orderbook_yesTokenId", "71321045679252212594626385532706912750332728571942532289631379312455583992563")[0]
  const noTokenId = useLocalStorage<string>("orderbook_noTokenId", "52114319501245915516055106046884209969926127482827954674443846427813813222426")[0]
  // Get condition ID from orderbook localStorage (for markets subscription)
  const conditionId = useLocalStorage<string>("orderbook_conditionId", "0x5f65177b394277fd294cd75650044e32ba009a95022d88a0c1d565897d72f8f1")[0]


  // Hardcoded market parameters
  const signatureType = 0 // Browser Wallet

  // Visibility states for hidden fields
  const [showPk, setShowPk] = useState(false)
  const [showClobApiKey, setShowClobApiKey] = useState(false)
  const [showClobSecret, setShowClobSecret] = useState(false)
  const [showClobPassPhrase, setShowClobPassPhrase] = useState(false)

  // WebSocket refs and state for user channel
  const userWsRef = useRef<WebSocket | null>(null)
  const userReconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const userReconnectAttemptRef = useRef(0)
  const shouldUserReconnectRef = useRef(true)
  const [userReconnectKey, setUserReconnectKey] = useState(0)

  // Get host and chainId from localStorage or defaults
  const [host] = useState(() => {
    if (typeof window === "undefined") return "https://clob-staging.polymarket.com"
    try {
      const stored = localStorage.getItem("config_httpUrl")
      if (stored) {
        // Parse JSON since useLocalStorage stores values as JSON strings
        const parsed = JSON.parse(stored)
        if (parsed) {
          // Strip any quotes that might be embedded in the string
          const cleaned = String(parsed).replace(/^["']|["']$/g, '')
          return cleaned

        }
      }
    } catch {
      // If parsing fails, try using raw value (for backwards compatibility)
      const raw = localStorage.getItem("config_httpUrl")
      if (raw) {
        // Strip any quotes that might be embedded in the string
        const cleaned = raw.replace(/^["']|["']$/g, '')
        return cleaned
      }
    }
    const defaultHost = process.env.NEXT_PUBLIC_HTTP_URL || "https://clob-staging.polymarket.com"
    return defaultHost.replace(/^["']|["']$/g, '')
  })

  const [chainId] = useState(() => {
    if (typeof window === "undefined") return 80002
    try {
      const stored = localStorage.getItem("config_chainId")
      if (stored) {
        // Parse JSON since useLocalStorage stores values as JSON strings
        const parsed = JSON.parse(stored)
        if (parsed) return parseInt(String(parsed))
      }
    } catch {
      // If parsing fails, try using raw value (for backwards compatibility)
      const raw = localStorage.getItem("config_chainId")
      if (raw) return parseInt(raw)
    }
    return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80002")
  })

  // Get WebSocket URL from localStorage or defaults
  const [wsUrl] = useState(() => {
    if (typeof window === "undefined") return "wss://ws-subscriptions-clob-staging.polymarket.com"
    try {
      const stored = localStorage.getItem("config_wsUrl")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed) {
          const cleaned = String(parsed).replace(/^["']|["']$/g, '')
          return cleaned
        }
      }
    } catch {
      const raw = localStorage.getItem("config_wsUrl")
      if (raw) {
        const cleaned = raw.replace(/^["']|["']$/g, '')
        return cleaned
      }
    }
    const defaultWsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://ws-subscriptions-clob-staging.polymarket.com"
    return defaultWsUrl.replace(/^["']|["']$/g, '')
  })

  // Helper function to get short address (first 6 digits after 0x)
  const getShortAddress = (addr: string): string => {
    if (!addr || !addr.startsWith("0x")) return ""
    return addr.slice(2, 8).toUpperCase()
  }

  // Helper function to extract URI path from full URL
  const getUriPath = (url: string): string => {
    try {
      const urlObj = new URL(url)
      return urlObj.pathname
    } catch {
      // If URL parsing fails, try to extract path manually
      const match = url.match(/\/[^?]*/)
      return match ? match[0] : url
    }
  }


  // Helper function to extract error payload from API errors
  const extractErrorPayload = (error: unknown): any => {
    if (error && typeof error === "object") {
      const errorObj = error as any

      // Try to extract response data (common in HTTP errors)
      if (errorObj.response?.data) {
        const responseData = errorObj.response.data
        // If response.data has error/status fields, prioritize those
        if (responseData.error !== undefined || (typeof responseData.status === "number" && responseData.status >= 400)) {
          return {
            status: responseData.status || errorObj.response?.status,
            statusText: errorObj.response?.statusText,
            error: responseData.error,
            data: responseData,
            message: errorObj.message,
          }
        }
        return {
          status: errorObj.response?.status,
          statusText: errorObj.response?.statusText,
          data: responseData,
          message: errorObj.message,
        }
      }

      // Check for error in body property (some HTTP clients use this)
      if (errorObj.body && typeof errorObj.body === "object") {
        const bodyData = errorObj.body
        if (bodyData.error !== undefined || (typeof bodyData.status === "number" && bodyData.status >= 400)) {
          return {
            status: bodyData.status || errorObj.status,
            error: bodyData.error,
            data: bodyData,
            message: errorObj.message,
          }
        }
      }

      // Check if error object itself has error and status fields (direct API error response)
      // This handles: { error: "...", status: 400 }
      if (errorObj.error !== undefined || (typeof errorObj.status === "number" && errorObj.status >= 400)) {
        return errorObj
      }

      // Try to parse error message as JSON (in case error response is stringified)
      if (error instanceof Error && error.message) {
        try {
          const parsed = JSON.parse(error.message)
          if (parsed && typeof parsed === "object" && (parsed.error !== undefined || (typeof parsed.status === "number" && parsed.status >= 400))) {
            return parsed
          }
        } catch {
          // Not JSON, continue
        }
      }

      // If it's an Error object, extract useful properties
      if (error instanceof Error) {
        return {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        }
      }

      // Otherwise, return the error object as-is
      return errorObj
    }

    // If error is a string, try to parse it as JSON
    if (typeof error === "string") {
      try {
        const parsed = JSON.parse(error)
        if (parsed && typeof parsed === "object" && (parsed.error !== undefined || (typeof parsed.status === "number" && parsed.status >= 400))) {
          return parsed
        }
      } catch {
        // Not JSON, return as message
      }
      return { message: error }
    }

    return { message: String(error) }
  }

  // Create CLOB client instance
  const clobClient = useMemo(() => {
    if (!pk || !address || !clobApiKey || !clobSecret || !clobPassPhrase) {
      return null
    }

    try {
      const wallet = new Wallet(pk)
      const creds = {
        key: clobApiKey,
        secret: clobSecret,
        passphrase: clobPassPhrase,
      }

      // Ensure host is clean (no quotes, trimmed)
      const cleanHost = String(host).trim().replace(/^["']|["']$/g, '')

      return new ClobClient(
        cleanHost,
        chainId as any,
        wallet,
        creds,
        signatureType,
        address
      )
    } catch (error) {
      addLog(`Error creating CLOB client: ${error instanceof Error ? error.message : String(error)}`, "error")
      return null
    }
  }, [pk, address, clobApiKey, clobSecret, clobPassPhrase, host, chainId, signatureType, addLog])

  // Function to fetch orders from CLOB client
  const fetchOrders = useCallback(async () => {
    if (!clobClient) {
      setOrders([])
      return
    }

    const apiUrl = `${host}/orders`
    const uriPath = getUriPath(apiUrl)
    const shortAddr = getShortAddress(address)
    const startTime = performance.now()

    try {
      const openOrders = await clobClient.getOpenOrders()
      const latency = Math.round(performance.now() - startTime)

      // Log receive with payload and latency
      addLog(`GET ${uriPath} [0x${shortAddr}] ${latency}ms`, "receive", openOrders)

      // Transform OpenOrder[] to Order[]
      const transformedOrders: Order[] = openOrders.map((openOrder) => {
        // Map side: "BUY" -> "buy", "SELL" -> "sell"
        const type: OrderType = openOrder.side === "BUY" ? "buy" : "sell"

        // Map outcome: "YES" -> "yes", "NO" -> "no"
        const side: OrderSide = openOrder.outcome === "YES" ? "yes" : "no"

        // Calculate remaining size (original_size - size_matched)
        const remainingSize = parseFloat(openOrder.original_size) - parseFloat(openOrder.size_matched)

        // Map order_type to TimeInForce
        let tif: TimeInForce = "GTC"
        if (openOrder.order_type === "FOK") tif = "FOK"
        else if (openOrder.order_type === "FAK") tif = "FAK"
        else if (openOrder.order_type === "GTD") tif = "GTD"

        return {
          id: openOrder.id,
          type,
          side,
          price: parseFloat(openOrder.price),
          size: remainingSize,
          tif,
          timestamp: new Date(openOrder.created_at * 1000).toISOString(),
          status: openOrder.status,
        }
      })

      setOrders(transformedOrders)
    } catch (error) {
      const errorPayload = extractErrorPayload(error)
      const latency = Math.round(performance.now() - startTime)
      addLog(`GET ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", errorPayload)
    }
  }, [clobClient, addLog, host, address])

  // Function to fetch trades from CLOB client
  const fetchTrades = useCallback(async () => {
    if (!clobClient) {
      setTrades([])
      return
    }

    const apiUrl = `${host}/data/trades`
    const uriPath = getUriPath(apiUrl)
    const shortAddr = getShortAddress(address)
    const startTime = performance.now()



    try {
      // Try fetching trades - getTrades() should return trades for the authenticated user
      // Optionally, you can filter by market or asset_id if needed
      const tradesData = await clobClient.getTrades(undefined, true, undefined)
      const latency = Math.round(performance.now() - startTime)

      // Log receive with payload and latency
      addLog(`GET ${uriPath} [0x${shortAddr}] ${latency}ms`, "receive", tradesData)

      // Check if tradesData is valid
      if (!tradesData || !Array.isArray(tradesData)) {
        setTrades([])
        return
      }

      // Transform Trade[] to our Trade format
      const transformedTrades: Trade[] = tradesData.map((trade) => {
        // Map Side.BUY -> "buy", Side.SELL -> "sell"
        let side: "buy" | "sell" = trade.side === "BUY" ? "buy" : "sell"

        // If trader_side is "MAKER", swap the side
        // When you're the maker, the side is opposite to what you see in the trade
        if (trade.trader_side === "MAKER") {
          side = side === "buy" ? "sell" : "buy"
        }

        // Parse timestamp - match_time could be ISO string or timestamp number
        let timestamp: string
        try {
          const timeValue = trade.match_time || trade.last_update || "0"
          // If it's a number (timestamp in seconds), convert to milliseconds
          if (typeof timeValue === "number" || /^\d+$/.test(String(timeValue))) {
            timestamp = new Date(parseInt(String(timeValue)) * 1000).toISOString()
          } else {
            timestamp = new Date(timeValue).toISOString()
          }
        } catch {
          timestamp = new Date().toISOString()
        }

        return {
          id: trade.id || String(trade.match_time || Date.now()),
          side,
          asset_id: trade.asset_id || "",
          outcome: trade.outcome || "",
          price: parseFloat(trade.price || "0"),
          size: parseFloat(trade.size || "0"),
          timestamp,
          order_id: trade.taker_order_id || "",
        }
      })

      setTrades(transformedTrades)
    } catch (error) {
      const errorPayload = extractErrorPayload(error)
      const latency = Math.round(performance.now() - startTime)
      addLog(`GET ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", errorPayload)
      setTrades([])
    }
  }, [clobClient, addLog, host, address])

  // Periodically fetch orders from CLOB client
  useEffect(() => {
    if (!clobClient) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setOrders([])
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    // Fetch immediately (deferred to avoid synchronous setState in effect)
    const initialTimeoutId = setTimeout(() => {
      fetchOrders()
    }, 0)

    // Then fetch every 5 seconds
    const interval = setInterval(fetchOrders, 5000)

    return () => {
      clearTimeout(initialTimeoutId)
      clearInterval(interval)
    }
  }, [clobClient, fetchOrders])

  // Periodically fetch trades from CLOB client
  useEffect(() => {
    if (!clobClient) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setTrades([])
      }, 0)
      return () => clearTimeout(timeoutId)
    }

    // Fetch immediately (deferred to avoid synchronous setState in effect)
    const initialTimeoutId = setTimeout(() => {
      fetchTrades()
    }, 0)

    // Then fetch every 5 seconds
    const interval = setInterval(fetchTrades, 5000)

    return () => {
      clearTimeout(initialTimeoutId)
      clearInterval(interval)
    }
  }, [clobClient, fetchTrades])

  // WebSocket connection for user channel (trades and orders)
  useEffect(() => {
    // Only connect if we have auth credentials
    if (!clobApiKey || !clobSecret || !clobPassPhrase) {
      return
    }

    // Clear any existing reconnect timeout
    if (userReconnectTimeoutRef.current) {
      clearTimeout(userReconnectTimeoutRef.current)
      userReconnectTimeoutRef.current = null
    }

    // Close existing connection if credentials change
    if (userWsRef.current) {
      shouldUserReconnectRef.current = false
      userWsRef.current.close()
      userWsRef.current = null
    }

    // Connect to WebSocket for user channel
    if (!wsUrl || wsUrl.trim() === "") {
      const shortAddr = getShortAddress(address)
      addLog(`CONNECT ERROR user [0x${shortAddr}]`, "error", { message: "WebSocket URL is empty" })
      return
    }

    // Append /ws/user to the WebSocket URL
    const userWsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws/user` : `${wsUrl}/ws/user`
    const ws = new WebSocket(userWsUrl)

    // Enable reconnection for this new connection
    shouldUserReconnectRef.current = true

    ws.onopen = () => {
      userReconnectAttemptRef.current = 0
      shouldUserReconnectRef.current = true

      const shortAddr = getShortAddress(address)
      addLog(`CONNECTED user [0x${shortAddr}]`, "receive", { url: userWsUrl })

      // Subscribe to user channel with auth for trades and orders
      const USER_CHANNEL = "user"
      // Use condition ID from orderbook for markets subscription
      const markets: string[] = []
      if (conditionId) markets.push(conditionId)

      const auth = {
        apikey: clobApiKey,
        secret: clobSecret,
        passphrase: clobPassPhrase,
      }

      const subscribeMessage = {
        markets: markets,
        type: USER_CHANNEL,
        auth: auth,
      }

      ws.send(JSON.stringify(subscribeMessage))
      // Log send with payload (masked secrets)
      addLog(`SEND user [0x${shortAddr}]`, "send", { markets, type: USER_CHANNEL, auth: { ...auth, secret: "***", passphrase: "***" } })
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const shortAddr = getShortAddress(address)
        addLog(`RECEIVE user [0x${shortAddr}]`, "receive", data)
      } catch (error) {
        const shortAddr = getShortAddress(address)
        addLog(`ERROR RECEIVE user [0x${shortAddr}]`, "error", JSON.stringify(error))
      }
    }

    ws.onerror = (error) => {
      const shortAddr = getShortAddress(address)
      addLog(`CONNECT ERROR user [0x${shortAddr}]`, "error", JSON.stringify(error))
    }

    ws.onclose = (event) => {
      const shortAddr = getShortAddress(address)
      const closeInfo = {
        code: event.code,
        reason: event.reason || "No reason provided",
        wasClean: event.wasClean,
        url: userWsUrl
      }
      addLog(`DISCONNECTED user [0x${shortAddr}]`, "error", closeInfo)

      // Only attempt reconnection if we should reconnect and the connection wasn't manually closed
      if (shouldUserReconnectRef.current && event.code !== 1000) {
        userReconnectAttemptRef.current += 1
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, userReconnectAttemptRef.current - 1), 30000)

        userReconnectTimeoutRef.current = setTimeout(() => {
          if (shouldUserReconnectRef.current && (!userWsRef.current || userWsRef.current.readyState === WebSocket.CLOSED)) {
            // Trigger reconnection by updating reconnectKey
            setUserReconnectKey(prev => prev + 1)
          }
        }, delay)
      }
    }

    userWsRef.current = ws

    return () => {
      // Clear reconnect timeout
      if (userReconnectTimeoutRef.current) {
        clearTimeout(userReconnectTimeoutRef.current)
        userReconnectTimeoutRef.current = null
      }

      // Disable reconnection on cleanup
      shouldUserReconnectRef.current = false

      if (userWsRef.current) {
        userWsRef.current.close()
        userWsRef.current = null
      }
    }
  }, [clobApiKey, clobSecret, clobPassPhrase, wsUrl, storageKey, addLog, conditionId, userReconnectKey, address])

  // Function to cancel an order
  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!clobClient) {
      addLog("Error: CLOB client not initialized", "error")
      return
    }

    const apiUrl = `${host}/orders/${orderId}`
    const uriPath = getUriPath(apiUrl)
    const shortAddr = getShortAddress(address)
    const startTime = performance.now()

    try {
      const response = await clobClient.cancelOrder({ orderID: orderId })
      const latency = Math.round(performance.now() - startTime)

      addLog(`DELETE ${uriPath} [0x${shortAddr}] ${latency}ms`, "receive", response)
      // Refetch orders to update the list
      await fetchOrders()
    } catch (error) {
      const errorPayload = extractErrorPayload(error)
      const latency = Math.round(performance.now() - startTime)
      addLog(`DELETE ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", errorPayload)
    }
  }, [clobClient, addLog, fetchOrders, host, address])

  // Function to cancel all orders
  const handleCancelAll = useCallback(async () => {
    if (!clobClient) {
      addLog("Error: CLOB client not initialized", "error")
      return
    }

    if (orders.length === 0) {
      return
    }

    const apiUrl = `${host}/orders`
    const uriPath = getUriPath(apiUrl)
    const shortAddr = getShortAddress(address)
    const startTime = performance.now()

    try {
      const response = await clobClient.cancelAll()
      const latency = Math.round(performance.now() - startTime)

      addLog(`DELETE ${uriPath} [0x${shortAddr}] ${latency}ms`, "receive", response)
      // Refetch orders to update the list
      await fetchOrders()
    } catch (error) {
      const errorPayload = extractErrorPayload(error)
      const latency = Math.round(performance.now() - startTime)
      addLog(`DELETE ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", errorPayload)
    }
  }, [clobClient, addLog, fetchOrders, orders.length, host, address])

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Get token ID based on side
    const tokenID = orderSide === "yes" ? yesTokenId : noTokenId

    if (!tokenID) {
      addLog(
        `Error: Token ID not found for ${orderSide} side. Please set token IDs in the orderbook.`,
        "error"
      )
      setIsSubmitting(false)
      return
    }

    if (!pk || !address) {
      addLog(
        `Error: Private key and funder address are required.`,
        "error"
      )
      setIsSubmitting(false)
      return
    }

    if (!clobClient) {
      addLog(
        `Error: CLOB client not initialized. Please check your credentials.`,
        "error"
      )
      setIsSubmitting(false)
      return
    }

    const apiUrl = `${host}/orders`
    const uriPath = getUriPath(apiUrl)
    const shortAddr = getShortAddress(address)
    const startTime = performance.now()

    try {
      // Map order type to CLOB Side enum
      const clobSide = orderType === "buy" ? Side.BUY : Side.SELL

      // Determine if this is a market order (FOK/FAK) or limit order (GTC/GTD)
      const isMarketOrder = tif === "FOK" || tif === "FAK"

      let response: any

      if (isMarketOrder) {
        // Market orders use createAndPostMarketOrder
        const clobOrderType = tif === "FOK" ? ClobOrderType.FOK : ClobOrderType.FAK

        const userMarketOrder = {
          tokenID,
          price: parseFloat(price), // Optional for market orders
          amount: parseFloat(size), // For BUY: $$$ amount, for SELL: shares
          side: clobSide,
        }

        response = await clobClient.createAndPostMarketOrder(
          userMarketOrder,
          {
            tickSize: "0.01",
            negRisk: false,
          },
          clobOrderType,
          false // deferExec
        )
      } else {
        // Limit orders use createAndPostOrder
        const clobOrderType = tif === "GTD" ? ClobOrderType.GTD : ClobOrderType.GTC

        const userOrder = {
          tokenID,
          price: parseFloat(price),
          size: parseFloat(size),
          side: clobSide,
        }

        response = await clobClient.createAndPostOrder(
          userOrder,
          {
            tickSize: "0.01",
            negRisk: false,
          },
          clobOrderType,
          false // deferExec
        )
      }

      const latency = Math.round(performance.now() - startTime)

      // Check if response indicates an error
      // The error response structure: { error: "...", status: 400 }
      const isError = response.status === 400

      if (isError) {
        addLog(`POST ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", response)
      } else {
        addLog(`POST ${uriPath} [0x${shortAddr}] ${latency}ms`, "receive", response)
        // Refetch orders to show the new order
        await fetchOrders()
      }
    } catch (error) {
      const errorPayload = extractErrorPayload(error)
      const latency = Math.round(performance.now() - startTime)
      addLog(`POST ${uriPath} [0x${shortAddr}] ${latency}ms`, "error", errorPayload)
    }

    setIsSubmitting(false)
  }

  return (
    <div className="flex h-full flex-col rounded-sm border border-white/30 bg-black">
      <div className="border-b border-white/30">
        <div className="px-1 py-0.5">
          <h2 className="text-xs">trade[0x{getShortAddress(address).toUpperCase()}]</h2>
        </div>
        <div className="px-1 py-1 space-y-1 border-t border-white/30">
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-13">ACC</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => copyToClipboard(address)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-13">PK</label>
            <input
              type="text"
              value={showPk ? pk : "****"}
              onChange={(e) => {
                if (showPk) {
                  setPk(e.target.value)
                }
              }}
              onFocus={() => setShowPk(true)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowPk(!showPk)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              {showPk ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(pk)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-13">KEY</label>
            <input
              type="text"
              value={showClobApiKey ? clobApiKey : "****"}
              onChange={(e) => {
                if (showClobApiKey) {
                  setClobApiKey(e.target.value)
                }
              }}
              onFocus={() => setShowClobApiKey(true)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobApiKey(!showClobApiKey)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              {showClobApiKey ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobApiKey)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-13">SECRET</label>
            <input
              type="text"
              value={showClobSecret ? clobSecret : "****"}
              onChange={(e) => {
                if (showClobSecret) {
                  setClobSecret(e.target.value)
                }
              }}
              onFocus={() => setShowClobSecret(true)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobSecret(!showClobSecret)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              {showClobSecret ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobSecret)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap w-13">PASS</label>
            <input
              type="text"
              value={showClobPassPhrase ? clobPassPhrase : "****"}
              onChange={(e) => {
                if (showClobPassPhrase) {
                  setClobPassPhrase(e.target.value)
                }
              }}
              onFocus={() => setShowClobPassPhrase(true)}
              className="flex-1 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobPassPhrase(!showClobPassPhrase)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              {showClobPassPhrase ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobPassPhrase)}
              className="p-0.5 text-white hover:bg-white/5 hover:opacity-70 active:opacity-50 transition-colors"
            >
              <Copy className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col p-1 flex-shrink-0">
        {/* Order Type Toggle */}
        <div className="mb-1 flex gap-1">
          <Button
            type="button"
            variant={orderType === "buy" ? "default" : "outline"}
            className={`flex-1 text-xs py-1 h-7 ${orderType === "buy" ? "" : "bg-black"}`}
            onClick={() => setOrderType("buy")}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={orderType === "sell" ? "default" : "outline"}
            className={`flex-1 text-xs py-1 h-7 ${orderType === "sell" ? "" : "bg-black"}`}
            onClick={() => setOrderType("sell")}
          >
            Sell
          </Button>
        </div>

        {/* Side Selection */}
        <div className="mb-1 flex gap-1">
          <Button
            type="button"
            variant={orderSide === "yes" ? "default" : "outline"}
            className={`flex-1 text-xs py-1 h-7 ${orderSide === "yes" ? "" : "bg-black"}`}
            onClick={() => setOrderSide("yes")}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={orderSide === "no" ? "default" : "outline"}
            className={`flex-1 text-xs py-1 h-7 ${orderSide === "no" ? "" : "bg-black"}`}
            onClick={() => setOrderSide("no")}
          >
            No
          </Button>
        </div>

        {/* Price Input */}
        <div className="mb-1">
          <label
            htmlFor="price"
            className="mb-0.5 block text-xs font-medium text-foreground"
          >
            Price
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full rounded-sm border border-white/30 bg-black px-1 py-0.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0.00"
            required
          />
        </div>

        {/* Size Input */}
        <div className="mb-1">
          <label
            htmlFor="size"
            className="mb-0.5 block text-xs font-medium text-foreground"
          >
            Size
          </label>
          <input
            id="size"
            type="number"
            step="0.01"
            min="0"
            value={size}
            onChange={e => setSize(e.target.value)}
            className="w-full rounded-sm border border-white/30 bg-black px-1 py-0.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0.00"
            required
          />
        </div>

        {/* TIF (Time In Force) */}
        <div className="mb-1">
          <label
            htmlFor="tif"
            className="mb-0.5 block text-xs font-medium text-foreground"
          >
            TIF
          </label>
          <select
            id="tif"
            value={tif}
            onChange={e => setTif(e.target.value as TimeInForce)}
            className="w-full rounded-sm border border-white/30 bg-black px-1 py-0.5 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="GTC">GTC</option>
            <option value="FAK">FAK</option>
            <option value="FOK">FOK</option>
            <option value="GTD">GTD</option>
          </select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-black text-xs py-1 h-7"
          disabled={isSubmitting || !price || !size}
        >
          {isSubmitting
            ? "LOADING..."
            : `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`}
        </Button>
      </form>

      {/* Line Separator */}
      <div className="border-t border-white/30"></div>

      {/* Orders Section with Tabs */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Tabs */}
        <div className="flex border-b border-white/30">
          <button
            onClick={() => setActiveTab("trades")}
            className={`flex-1 px-1 flex items-center justify-center border-r border-white/30 text-xs font-medium transition-colors ${activeTab === "trades"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '24px' }}
          >
            Trades
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 px-1 flex items-center justify-center text-xs font-medium transition-colors ${activeTab === "orders"
              ? "bg-white/10 text-white"
              : "text-muted-foreground hover:text-white hover:bg-white/5"
              }`}
            style={{ height: '24px' }}
          >
            Orders
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "trades" && (
            <TradesTable trades={trades} />
          )}
          {activeTab === "orders" && (
            <OrdersTable orders={orders} onCancel={handleCancelOrder} onCancelAll={handleCancelAll} />
          )}
        </div>
      </div>
    </div>
  )
}

