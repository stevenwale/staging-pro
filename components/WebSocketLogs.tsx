"use client"

import { useEffect, useRef } from "react"
import { Download } from "lucide-react"
import { useLogs, LogType } from "@/lib/log-context"
import { Button } from "@/components/ui/button"

export function WebSocketLogs() {
    const { logs, allLogs } = useLogs()
    const logsEndRef = useRef<HTMLDivElement>(null)

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

    const downloadLogs = () => {
        if (allLogs.length === 0) {
            return
        }

        const logsData = allLogs.map(log => ({
            timestamp: log.timestamp.toISOString(),
            type: log.type,
            message: log.message,
        }))

        const dataStr = JSON.stringify(logsData, null, 2)
        const dataBlob = new Blob([dataStr], { type: "application/json" })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement("a")
        link.href = url
        link.download = `logs-${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="flex h-full flex-col rounded-sm border border-white/30 bg-black min-h-0">
            <div className="flex items-center justify-between border-b border-white/30 px-1 py-0.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <h2 className="text-xs">logs</h2>
                    <Button
                        variant="ghost"
                        className="!h-3 !w-3 !p-0 !min-w-0 [&_svg]:!h-3 [&_svg]:!w-3 active:opacity-50"
                        onClick={downloadLogs}
                        disabled={allLogs.length === 0}
                        title="Download all logs"
                    >
                        <Download className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            <div className="logs-scrollbar flex-1 overflow-y-auto overflow-x-hidden p-1 font-mono text-[10px] min-h-0">
                {logs.length === 0 ? (
                    <div className="text-center text-muted-foreground text-[10px]">
                        No logs yet
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {logs.map(log => (
                            <div
                                key={log.id}
                                className={`flex items-start gap-1 ${getLogColor(log.type)}`}
                            >
                                <span className="text-muted-foreground whitespace-nowrap text-[10px] leading-tight flex-shrink-0">
                                    {log.timestamp.toLocaleTimeString()}
                                </span>
                                <pre className="flex-1 break-words whitespace-pre-wrap font-mono text-[10px] leading-tight overflow-wrap-anywhere min-w-0">
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

