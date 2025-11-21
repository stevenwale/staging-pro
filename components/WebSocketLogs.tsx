"use client"

import { useEffect, useState, useRef } from "react"
import { useLogs, LogType } from "@/lib/log-context"

export function WebSocketLogs() {
    const { logs, addLog } = useLogs()
    const [isConnected, setIsConnected] = useState(false)
    const wsRef = useRef<WebSocket | null>(null)
    const logsEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Initialize WebSocket connection
        const connectWebSocket = () => {
            try {
                // Replace with your actual WebSocket URL
                const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "wss://echo.websocket.org"
                const ws = new WebSocket(wsUrl)

                ws.onopen = () => {
                    setIsConnected(true)
                    addLog("Connected to WebSocket", "connection")
                }

                ws.onmessage = event => {
                    addLog(`Received: ${event.data}`, "message")
                }

                ws.onerror = error => {
                    addLog(`WebSocket error: ${error}`, "error")
                }

                ws.onclose = () => {
                    setIsConnected(false)
                    addLog("WebSocket connection closed", "connection")
                    // Attempt to reconnect after 3 seconds
                    setTimeout(connectWebSocket, 3000)
                }

                wsRef.current = ws
            } catch (error) {
                addLog(`Failed to connect: ${error}`, "error")
            }
        }

        connectWebSocket()

        // Cleanup on unmount
        return () => {
            if (wsRef.current) {
                wsRef.current.close()
            }
        }
    }, [addLog])

    useEffect(() => {
        // Auto-scroll to bottom when new logs arrive
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [logs])

    const getLogColor = (type: LogType) => {
        switch (type) {
            case "error":
                return "text-destructive"
            case "connection":
                return "text-primary"
            case "api-request":
                return "text-blue-400"
            case "api-response":
                return "text-green-400"
            default:
                return "text-foreground"
        }
    }

    return (
        <div className="flex h-full flex-col rounded-lg border border-white/30 bg-black">
            <div className="flex items-center justify-between border-b border-white/30 px-2 py-1">
                <h2>logs</h2>
                <div className="flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                            }`}
                    />
                    <span className="text-xs text-muted-foreground">
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-2 font-mono text-xs">
                {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                        Waiting for WebSocket messages...
                    </div>
                ) : (
                    <div className="space-y-1">
                        {logs.map(log => (
                            <div
                                key={log.id}
                                className={`flex gap-2 ${getLogColor(log.type)}`}
                            >
                                <span className="text-muted-foreground whitespace-nowrap">
                                    {log.timestamp.toLocaleTimeString()}
                                </span>
                                <pre className="flex-1 break-words whitespace-pre-wrap font-mono text-xs">
                                    {log.message}
                                </pre>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    )
}

