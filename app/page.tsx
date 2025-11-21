"use client"

import { Orderbook } from "@/components/Orderbook"
import { TradeTicket } from "@/components/TradeTicket"
import { WebSocketLogs } from "@/components/WebSocketLogs"
import { useLocalStorage } from "@/lib/use-local-storage"
import { useLogs } from "@/lib/log-context"
import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Home() {
  const { clearLogs } = useLogs()
  const [wsUrl, setWsUrl] = useLocalStorage<string>(
    "config_wsUrl",
    process.env.NEXT_PUBLIC_WS_URL || "wss://ws-subscriptions-clob-staging.polymarket.com"
  )
  const [httpUrl, setHttpUrl] = useLocalStorage<string>(
    "config_httpUrl",
    process.env.NEXT_PUBLIC_HTTP_URL || ""
  )
  const [chainId, setChainId] = useLocalStorage<string>(
    "config_chainId",
    process.env.NEXT_PUBLIC_CHAIN_ID || ""
  )

  const handleReset = () => {
    // Clear all localStorage keys used in the app
    const keysToClear = [
      "config_wsUrl",
      "config_httpUrl",
      "config_chainId",
      "orderbook_activeTab",
      "orderbook_yesTokenId",
      "orderbook_noTokenId",
      "tradeticket_orderType",
      "tradeticket_orderSide",
      "tradeticket_tif",
      "tradeticket_address",
      "tradeticket_pk",
      "tradeticket_clobApiKey",
      "tradeticket_clobSecret",
      "tradeticket_clobPassPhrase",
      "tradeticket_2_orderType",
      "tradeticket_2_orderSide",
      "tradeticket_2_tif",
      "tradeticket_2_address",
      "tradeticket_2_pk",
      "tradeticket_2_clobApiKey",
      "tradeticket_2_clobSecret",
      "tradeticket_2_clobPassPhrase",
    ]

    keysToClear.forEach((key) => {
      localStorage.removeItem(key)
    })

    // Clear logs
    clearLogs()

    // Reset state values to defaults
    setWsUrl(process.env.NEXT_PUBLIC_WS_URL || "wss://ws-subscriptions-clob-staging.polymarket.com")
    setHttpUrl(process.env.NEXT_PUBLIC_HTTP_URL || "https://clob-staging.polymarket.com")
    setChainId(process.env.NEXT_PUBLIC_CHAIN_ID || "80002")

    // Reload the page to reset all components
    window.location.reload()
  }

  return (
    <div className="flex h-screen flex-col bg-black">
      <header className="border-b border-white/30 px-1 py-1 flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-xs font-italic font-bold">sp</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap">Chain ID:</label>
            <input
              type="text"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-20 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-1 max-w-md">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap">HTTP:</label>
            <input
              type="text"
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
              className="w-48 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-1 max-w-md">
            <label className="text-[10px] text-muted-foreground whitespace-nowrap">WS:</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-48 px-1 py-0.5 text-xs bg-black border border-white/30 rounded-sm focus:outline-none focus:border-white/50"
              placeholder="wss://..."
            />
          </div>
          <button
            onClick={handleReset}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
          </button>
        </div>
      </header>
      <main className="grid grid-cols-[4fr_3fr_3fr] flex-1 gap-1 overflow-hidden p-1">
        {/* First Column - Orderbook and Logs (4 parts) */}
        <div className="flex flex-col gap-1 min-h-0 min-w-0">
          <div className="flex-shrink-0">
            <Orderbook wsUrl={wsUrl} />
          </div>
          <div className="flex-1 min-h-0">
            <WebSocketLogs />
          </div>
        </div>

        {/* Second Column - First Trade Ticket (3 parts) */}
        <div className="flex flex-col min-h-0 min-w-0">
          <TradeTicket />
        </div>

        {/* Third Column - Second Trade Ticket (3 parts) */}
        <div className="flex flex-col min-h-0 min-w-0">
          <TradeTicket
            defaultAddress="0xD527CCdBEB6478488c848465F9947bDA3C2e6994"
            defaultPk="61925f6e49905e7551884129c1d46b3661d6b566173feee556737743162bec7d"
            defaultClobApiKey="1229b503-3124-94d7-0b28-46e64418510f"
            defaultClobSecret="1vslCNSHeKXnPIsitiDirDrQ8sPPI4hyXYqIXkBwfPs="
            defaultClobPassPhrase="8f25643b36d0c8be522646356010f3b1c61c1b47eada77ad8b4b58e9be7c87c0"
            storageKey="tradeticket_2"
          />
        </div>
      </main>
    </div>
  )
}
