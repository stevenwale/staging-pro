"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

export type LogType = "message" | "error" | "connection" | "api-request" | "api-response"

export interface LogEntry {
    id: string
    timestamp: Date
    message: string
    type: LogType
}

interface LogContextType {
    logs: LogEntry[]
    allLogs: LogEntry[]
    addLog: (message: string, type: LogType) => void
    clearLogs: () => void
}

const LogContext = createContext<LogContextType | undefined>(undefined)

export function LogProvider({ children }: { children: ReactNode }) {
    const [allLogs, setAllLogs] = useState<LogEntry[]>([]) // Store all logs
    const [logs, setLogs] = useState<LogEntry[]>([]) // Display only last 100

    const addLog = useCallback((message: string, type: LogType) => {
        const logEntry: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
            message,
            type,
        }
        setAllLogs(prev => [...prev, logEntry]) // Keep all logs
        setLogs(prev => [...prev, logEntry].slice(-100)) // Display only last 100
    }, [])

    const clearLogs = useCallback(() => {
        setAllLogs([])
        setLogs([])
    }, [])

    return (
        <LogContext.Provider value={{ logs, allLogs, addLog, clearLogs }}>
            {children}
        </LogContext.Provider>
    )
}

export function useLogs() {
    const context = useContext(LogContext)
    if (context === undefined) {
        throw new Error("useLogs must be used within a LogProvider")
    }
    return context
}

