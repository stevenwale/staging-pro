"use client"

import { useEffect, useState, useRef } from "react"

interface LogEntry {
    id: string
    timestamp: Date
    message: string
    type: "message" | "error" | "connection"
}

export function WebSocketLogs() {
    const [logs, setLogs] = useState<LogEntry[]>([])
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
    }, [])

    const addLog = (message: string, type: LogEntry["type"]) => {
        const logEntry: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            message,
            type,
        }
        setLogs(prev => [...prev, logEntry].slice(-100)) // Keep last 100 logs
    }

    useEffect(() => {
        // Auto-scroll to bottom when new logs arrive
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [logs])

    const getLogColor = (type: LogEntry["type"]) => {
        switch (type) {
            case "error":
                return "text-destructive"
            case "connection":
                return "text-primary"
            default:
                return "text-foreground"
        }
    }

    return (
        <div className="flex h-full flex-col rounded-lg border bg-card">
            <div className="flex items-center justify-between border-b px-2 py-1">
                <h2 className="text-lg font-semibold">logs</h2>
                <div className="flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full ${isConnected ? "bg-primary" : "bg-destructive"
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
                                <span className="text-muted-foreground">
                                    {log.timestamp.toLocaleTimeString()}
                                </span>
                                <span className="flex-1 break-words">{log.message}</span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                )}
            </div>
        </div>
    )
}

