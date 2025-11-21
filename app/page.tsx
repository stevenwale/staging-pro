"use client"

import { Orderbook } from "@/components/Orderbook"
import { TradeTicket } from "@/components/TradeTicket"
import { WebSocketLogs } from "@/components/WebSocketLogs"

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-2">
        <h1 className="text-lg font-bold">staging-pro</h1>
      </header>
      <main className="flex flex-1 gap-2 overflow-hidden p-2">
        {/* First Column - Orderbook */}
        <div className="flex-1">
          <Orderbook />
        </div>

        {/* Second Column - Trade Ticket */}
        <div className="flex-1">
          <TradeTicket />
        </div>

        {/* Third Column - WebSocket Logs */}
        <div className="flex-1">
          <WebSocketLogs />
        </div>
      </main>
    </div>
  )
}
