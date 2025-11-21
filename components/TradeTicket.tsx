"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { Copy, Eye, EyeOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogs } from "@/lib/log-context"
import { useLocalStorage } from "@/lib/use-local-storage"
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

interface OrdersTableProps {
  orders: Order[]
  onCancel: (orderId: string) => Promise<void>
  onCancelAll: () => Promise<void>
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
            {new Date(info.getValue() as string).toLocaleTimeString()}
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
                className="p-0.5 text-muted-foreground hover:text-white hover:bg-white/10 active:opacity-50 transition-colors rounded"
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
  const [price, setPrice] = useState("")
  const [size, setSize] = useState("")
  const [tif, setTif] = useLocalStorage<TimeInForce>(`${storageKey}_tif`, "GTC")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])

  // Trade settings
  const [address, setAddress] = useLocalStorage<string>(`${storageKey}_address`, defaultAddress)
  const [pk, setPk] = useLocalStorage<string>(`${storageKey}_pk`, defaultPk)
  const [clobApiKey, setClobApiKey] = useLocalStorage<string>(`${storageKey}_clobApiKey`, defaultClobApiKey)
  const [clobSecret, setClobSecret] = useLocalStorage<string>(`${storageKey}_clobSecret`, defaultClobSecret)
  const [clobPassPhrase, setClobPassPhrase] = useLocalStorage<string>(`${storageKey}_clobPassPhrase`, defaultClobPassPhrase)

  // Get token IDs from orderbook localStorage
  const yesTokenId = useLocalStorage<string>("orderbook_yesTokenId", "71321045679252212594626385532706912750332728571942532289631379312455583992563")[0]
  const noTokenId = useLocalStorage<string>("orderbook_noTokenId", "52114319501245915516055106046884209969926127482827954674443846427813813222426")[0]

  // Hardcoded market parameters
  const tickSize = "0.01"
  const negRisk = false
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
  const [isUserConnected, setIsUserConnected] = useState(false)
  const [userReconnectKey, setUserReconnectKey] = useState(0)

  // Get host and chainId from localStorage or defaults
  const host = useMemo(() => {
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
    } catch (e) {
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
  }, [])

  const chainId = useMemo(() => {
    if (typeof window === "undefined") return 80002
    try {
      const stored = localStorage.getItem("config_chainId")
      if (stored) {
        // Parse JSON since useLocalStorage stores values as JSON strings
        const parsed = JSON.parse(stored)
        if (parsed) return parseInt(String(parsed))
      }
    } catch (e) {
      // If parsing fails, try using raw value (for backwards compatibility)
      const raw = localStorage.getItem("config_chainId")
      if (raw) return parseInt(raw)
    }
    return parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "80002")
  }, [])

  // Get WebSocket URL from localStorage or defaults
  const wsUrl = useMemo(() => {
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
    } catch (e) {
      const raw = localStorage.getItem("config_wsUrl")
      if (raw) {
        const cleaned = raw.replace(/^["']|["']$/g, '')
        return cleaned
      }
    }
    const defaultWsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://ws-subscriptions-clob-staging.polymarket.com"
    return defaultWsUrl.replace(/^["']|["']$/g, '')
  }, [])

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

    try {
      const startTime = performance.now()
      const openOrders = await clobClient.getOpenOrders()
      const endTime = performance.now()
      const latency = endTime - startTime

      // Log latency
      addLog(`getOpenOrders latency: ${latency.toFixed(2)}ms`, "api-request")

      // Log raw orders from API
      addLog(`Received ${openOrders.length} orders from API: ${JSON.stringify(openOrders, null, 2)}`, "message")

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
      addLog(`Fetched ${transformedOrders.length} orders`, "message")
    } catch (error) {
      addLog(
        `Error fetching orders: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      )
    }
  }, [clobClient, addLog])

  // Periodically fetch orders from CLOB client
  useEffect(() => {
    if (!clobClient) {
      setOrders([])
      return
    }

    // Fetch immediately
    fetchOrders()

    // Then fetch every 5 seconds
    const interval = setInterval(fetchOrders, 5000)

    return () => {
      clearInterval(interval)
    }
  }, [clobClient, fetchOrders])

  // WebSocket connection for user channel (trades and orders)
  useEffect(() => {
    // Only connect if we have auth credentials
    if (!clobApiKey || !clobSecret || !clobPassPhrase) {
      setIsUserConnected(false)
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
      addLog(`[${storageKey}] WebSocket URL is empty`, "error")
      setIsUserConnected(false)
      return
    }

    // Append /ws/user to the WebSocket URL
    const userWsUrl = wsUrl.endsWith('/') ? `${wsUrl}ws/user` : `${wsUrl}/ws/user`
    const ws = new WebSocket(userWsUrl)

    // Enable reconnection for this new connection
    shouldUserReconnectRef.current = true

    ws.onopen = () => {
      addLog(`[${storageKey}] WebSocket connected for user channel: ${userWsUrl}`, "connection")
      setIsUserConnected(true)
      userReconnectAttemptRef.current = 0
      shouldUserReconnectRef.current = true

      // Subscribe to user channel with auth for trades and orders
      const USER_CHANNEL = "user"
      // Use token IDs from orderbook, or empty array to subscribe to all markets
      const markets: string[] = []
      if (yesTokenId) markets.push(yesTokenId)
      if (noTokenId) markets.push(noTokenId)

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
      addLog(`[${storageKey}] Subscribed to user channel (trades & orders): ${JSON.stringify({ markets, type: USER_CHANNEL, auth: { ...auth, secret: "***", passphrase: "***" } }, null, 2)}`, "message")
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        addLog(`[${storageKey}] User channel response: ${JSON.stringify(data, null, 2)}`, "message")
      } catch (error) {
        const errorMessage = `[${storageKey}] Error parsing user channel message: ${error instanceof Error ? error.message : String(error)}`
        addLog(errorMessage, "error")
      }
    }

    ws.onerror = (error) => {
      const errorMessage = `[${storageKey}] User channel WebSocket error: ${error instanceof Error ? error.message : String(error)}`
      addLog(errorMessage, "error")
      setIsUserConnected(false)
    }

    ws.onclose = (event) => {
      addLog(`[${storageKey}] User channel WebSocket closed (code: ${event.code}, reason: ${event.reason || 'none'})`, "connection")
      setIsUserConnected(false)

      // Only attempt reconnection if we should reconnect and the connection wasn't manually closed
      if (shouldUserReconnectRef.current && event.code !== 1000) {
        userReconnectAttemptRef.current += 1
        // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
        const delay = Math.min(1000 * Math.pow(2, userReconnectAttemptRef.current - 1), 30000)

        addLog(`[${storageKey}] Attempting to reconnect user channel in ${delay / 1000}s (attempt ${userReconnectAttemptRef.current})...`, "connection")

        userReconnectTimeoutRef.current = setTimeout(() => {
          if (shouldUserReconnectRef.current && (!userWsRef.current || userWsRef.current.readyState === WebSocket.CLOSED)) {
            // Trigger reconnection by updating reconnectKey
            setUserReconnectKey(prev => prev + 1)
          }
        }, delay)
      } else {
        addLog(`[${storageKey}] User channel WebSocket reconnection disabled (manual close or component unmounting)`, "connection")
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
  }, [clobApiKey, clobSecret, clobPassPhrase, wsUrl, storageKey, addLog, yesTokenId, noTokenId, userReconnectKey])

  // Function to cancel an order
  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!clobClient) {
      addLog("Error: CLOB client not initialized", "error")
      return
    }

    try {
      addLog(`Canceling order: ${orderId}`, "api-request")
      const startTime = performance.now()
      const response = await clobClient.cancelOrder({ orderID: orderId })
      const endTime = performance.now()
      const latency = endTime - startTime

      // Log latency
      addLog(`cancelOrder latency: ${latency.toFixed(2)}ms`, "api-request")
      addLog(`Order canceled: ${JSON.stringify(response, null, 2)}`, "api-response")
      // Refetch orders to update the list
      await fetchOrders()
    } catch (error) {
      addLog(
        `Error canceling order: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      )
    }
  }, [clobClient, addLog, fetchOrders])

  // Function to cancel all orders
  const handleCancelAll = useCallback(async () => {
    if (!clobClient) {
      addLog("Error: CLOB client not initialized", "error")
      return
    }

    if (orders.length === 0) {
      addLog("No orders to cancel", "message")
      return
    }

    try {
      addLog(`Canceling all ${orders.length} orders`, "api-request")
      const startTime = performance.now()
      const response = await clobClient.cancelAll()
      const endTime = performance.now()
      const latency = endTime - startTime

      // Log latency
      addLog(`cancelAll latency: ${latency.toFixed(2)}ms`, "api-request")
      addLog(`All orders canceled: ${JSON.stringify(response, null, 2)}`, "api-response")
      // Refetch orders to update the list
      await fetchOrders()
    } catch (error) {
      addLog(
        `Error canceling all orders: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      )
    }
  }, [clobClient, addLog, fetchOrders, orders.length])

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

    // Log order details (without sensitive data)
    const orderData = {
      type: orderType,
      side: orderSide,
      price: parseFloat(price),
      size: parseFloat(size),
      tif,
      tokenID,
      tickSize,
      negRisk,
      signatureType,
      host,
      chainId,
    }
    addLog(
      `Placing order: ${JSON.stringify(orderData, null, 2)}`,
      "api-request"
    )

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

        addLog(
          `Creating market order with CLOB client: ${JSON.stringify(userMarketOrder, null, 2)}`,
          "api-request"
        )

        const startTime = performance.now()
        response = await clobClient.createAndPostMarketOrder(
          userMarketOrder,
          {
            tickSize: "0.01",
            negRisk: false,
          },
          clobOrderType,
          false // deferExec
        )
        const endTime = performance.now()
        const latency = endTime - startTime

        // Log latency
        addLog(`createAndPostMarketOrder latency: ${latency.toFixed(2)}ms`, "api-request")
      } else {
        // Limit orders use createAndPostOrder
        const clobOrderType = tif === "GTD" ? ClobOrderType.GTD : ClobOrderType.GTC

        const userOrder = {
          tokenID,
          price: parseFloat(price),
          size: parseFloat(size),
          side: clobSide,
        }

        addLog(
          `Creating limit order with CLOB client: ${JSON.stringify(userOrder, null, 2)}`,
          "api-request"
        )

        const startTime = performance.now()
        response = await clobClient.createAndPostOrder(
          userOrder,
          {
            tickSize: "0.01",
            negRisk: false,
          },
          clobOrderType,
          false // deferExec
        )
        const endTime = performance.now()
        const latency = endTime - startTime

        // Log latency
        addLog(`createAndPostOrder latency: ${latency.toFixed(2)}ms`, "api-request")
      }

      // Log API response
      addLog(
        `Order Response: ${JSON.stringify(response, null, 2)}`,
        "api-response"
      )

      // Check if status is "live" (success), otherwise log as error
      if (response?.status === "live") {
        addLog(`Order placed successfully: ${response?.order_id || "unknown"}`, "api-response")
        // Refetch orders to show the new order
        await fetchOrders()
      } else {
        addLog(
          `Order failed with status ${response?.status || "unknown"}: ${JSON.stringify(response, null, 2)}`,
          "error"
        )
      }
    } catch (error) {
      addLog(
        `Order Error: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      )
      if (error instanceof Error && error.stack) {
        addLog(`Stack trace: ${error.stack}`, "error")
      }
    }

    setIsSubmitting(false)
    // Reset form
    setPrice("")
    setSize("")
  }

  return (
    <div className="flex h-full flex-col rounded-sm border border-white/30 bg-black">
      <div className="border-b border-white/30">
        <div className="px-1 py-0.5">
          <h2 className="text-xs">trade</h2>
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
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
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
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showPk ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(pk)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
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
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobApiKey ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobApiKey)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
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
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobSecret ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobSecret)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
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
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobPassPhrase ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobPassPhrase)}
              className="p-0.5 text-white hover:bg-white/5 active:opacity-50 transition-colors"
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
          className="mb-1 w-full bg-black text-xs py-1 h-7"
          disabled={isSubmitting || !price || !size}
        >
          {isSubmitting
            ? "Placing Order..."
            : `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`}
        </Button>
      </form>

      {/* Line Separator */}
      <div className="border-t border-white/30"></div>

      {/* Orders Section */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto">
          <OrdersTable orders={orders} onCancel={handleCancelOrder} onCancelAll={handleCancelAll} />
        </div>
      </div>
    </div>
  )
}

