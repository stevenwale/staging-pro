"use client"

import { useState } from "react"
import { Orderbook } from "@/components/Orderbook"
import { TradeTicket } from "@/components/TradeTicket"
import { WebSocketLogs } from "@/components/WebSocketLogs"

export default function Home() {
  const [wsUrl, setWsUrl] = useState<string>(
    process.env.NEXT_PUBLIC_WS_URL || "wss://echo.websocket.org"
  )
  const [httpUrl, setHttpUrl] = useState<string>(
    process.env.NEXT_PUBLIC_HTTP_URL || ""
  )
  const [chainId, setChainId] = useState<string>(
    process.env.NEXT_PUBLIC_CHAIN_ID || ""
  )

  return (
    <div className="flex h-screen flex-col bg-black">
      <header className="border-b border-white/30 px-2 py-2 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-lg font-italic font-bold">sp</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground whitespace-nowrap">Chain ID:</label>
            <input
              type="text"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              className="w-24 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <label className="text-xs text-muted-foreground whitespace-nowrap">HTTP:</label>
            <input
              type="text"
              value={httpUrl}
              onChange={(e) => setHttpUrl(e.target.value)}
              className="w-64 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2 max-w-md">
            <label className="text-xs text-muted-foreground whitespace-nowrap">WS:</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-64 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
              placeholder="wss://..."
            />
          </div>
        </div>
      </header>
      <main className="grid grid-cols-[4fr_3fr_3fr] flex-1 gap-2 overflow-hidden p-2">
        {/* First Column - Orderbook and Logs (4 parts) */}
        <div className="flex flex-col gap-2 min-h-0 min-w-0">
          <div className="flex-shrink-0">
            <Orderbook />
          </div>
          <div className="flex-1 min-h-0">
            <WebSocketLogs wsUrl={wsUrl} />
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
          />
        </div>
      </main>
    </div>
  )
}
