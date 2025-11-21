"use client"

import { useState } from "react"
import { Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLogs } from "@/lib/log-context"

type OrderType = "buy" | "sell"
type OrderSide = "yes" | "no"
type TimeInForce = "GTC" | "IOC" | "FOK"

export function TradeTicket() {
  const { addLog } = useLogs()
  const [orderType, setOrderType] = useState<OrderType>("buy")
  const [orderSide, setOrderSide] = useState<OrderSide>("yes")
  const [price, setPrice] = useState("")
  const [size, setSize] = useState("")
  const [tif, setTif] = useState<TimeInForce>("GTC")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Trade settings
  const [address, setAddress] = useState<string>("0xFeA4cB3dD4ca7CefD3368653B7D6FF9BcDFca604")
  const [pk, setPk] = useState<string>("79eb3f434fe848db33e1f86107a407a01d1dd18c5da4b03d674a47a5499380c7")
  const [clobApiKey, setClobApiKey] = useState<string>("b349bff6-7af8-0470-ed25-22a2a5e1c154")
  const [clobSecret, setClobSecret] = useState<string>("qXRtb5OefyuZdv9A4lZ3JAaoBn1-JTZJ7KKQ63jstqY=")
  const [clobPassPhrase, setClobPassPhrase] = useState<string>("2cd4e53cbde7caf0771a5ea0669c2b67f7fa962d5d8c8c241564fd7ece626ade")

  // Visibility states for hidden fields
  const [showPk, setShowPk] = useState(false)
  const [showClobApiKey, setShowClobApiKey] = useState(false)
  const [showClobSecret, setShowClobSecret] = useState(false)
  const [showClobPassPhrase, setShowClobPassPhrase] = useState(false)

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

    const orderData = {
      type: orderType,
      side: orderSide,
      price: parseFloat(price),
      size: parseFloat(size),
      tif,
    }

    // Log API request
    const requestBody = JSON.stringify(orderData)
    addLog(
      `API Request: POST /api/orders\n${requestBody}`,
      "api-request"
    )

    try {
      // Make API call
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
      })

      const responseData = await response.json()

      // Log API response
      addLog(
        `API Response: ${response.status} ${response.statusText}\n${JSON.stringify(responseData, null, 2)}`,
        response.ok ? "api-response" : "error"
      )

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to place order")
      }
    } catch (error) {
      addLog(
        `API Error: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      )
    }

    setIsSubmitting(false)
    // Reset form
    setPrice("")
    setSize("")
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-white/30 bg-black">
      <div className="border-b border-white/30">
        <div className="px-2 py-1">
          <h2>trade</h2>
        </div>
        <div className="px-2 py-2 space-y-2 border-t border-white/30">
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap w-13">ACC</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => copyToClipboard(address)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap w-13">PK</label>
            <input
              type="text"
              value={showPk ? pk : "****"}
              onChange={(e) => {
                if (showPk) {
                  setPk(e.target.value)
                }
              }}
              onFocus={() => setShowPk(true)}
              className="flex-1 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowPk(!showPk)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showPk ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => copyToClipboard(pk)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap w-13">KEY</label>
            <input
              type="text"
              value={showClobApiKey ? clobApiKey : "****"}
              onChange={(e) => {
                if (showClobApiKey) {
                  setClobApiKey(e.target.value)
                }
              }}
              onFocus={() => setShowClobApiKey(true)}
              className="flex-1 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobApiKey(!showClobApiKey)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobApiKey)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap w-13">SECRET</label>
            <input
              type="text"
              value={showClobSecret ? clobSecret : "****"}
              onChange={(e) => {
                if (showClobSecret) {
                  setClobSecret(e.target.value)
                }
              }}
              onFocus={() => setShowClobSecret(true)}
              className="flex-1 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobSecret(!showClobSecret)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobSecret)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1">
            <label className="text-xs text-muted-foreground whitespace-nowrap w-13">PASS</label>
            <input
              type="text"
              value={showClobPassPhrase ? clobPassPhrase : "****"}
              onChange={(e) => {
                if (showClobPassPhrase) {
                  setClobPassPhrase(e.target.value)
                }
              }}
              onFocus={() => setShowClobPassPhrase(true)}
              className="flex-1 px-2 py-1 text-sm bg-black border border-white/30 rounded focus:outline-none focus:border-white/50"
            />
            <button
              onClick={() => setShowClobPassPhrase(!showClobPassPhrase)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              {showClobPassPhrase ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
            <button
              onClick={() => copyToClipboard(clobPassPhrase)}
              className="p-1 text-white hover:bg-white/5 active:opacity-50 transition-colors"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-2">
        {/* Order Type Toggle */}
        <div className="mb-2 flex gap-2">
          <Button
            type="button"
            variant={orderType === "buy" ? "default" : "outline"}
            className="flex-1 bg-black"
            onClick={() => setOrderType("buy")}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={orderType === "sell" ? "default" : "outline"}
            className="flex-1 bg-black"
            onClick={() => setOrderType("sell")}
          >
            Sell
          </Button>
        </div>

        {/* Side Selection */}
        <div className="mb-2 flex gap-2">
          <Button
            type="button"
            variant={orderSide === "yes" ? "default" : "outline"}
            className="flex-1 bg-black"
            onClick={() => setOrderSide("yes")}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={orderSide === "no" ? "default" : "outline"}
            className="flex-1 bg-black"
            onClick={() => setOrderSide("no")}
          >
            No
          </Button>
        </div>

        {/* Price Input */}
        <div className="mb-2">
          <label
            htmlFor="price"
            className="mb-1 block text-sm font-medium text-foreground"
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
            className="w-full rounded-md border border-white/30 bg-black px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0.00"
            required
          />
        </div>

        {/* Size Input */}
        <div className="mb-2">
          <label
            htmlFor="size"
            className="mb-1 block text-sm font-medium text-foreground"
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
            className="w-full rounded-md border border-white/30 bg-black px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0.00"
            required
          />
        </div>

        {/* TIF (Time In Force) */}
        <div className="mb-2">
          <label
            htmlFor="tif"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            TIF
          </label>
          <select
            id="tif"
            value={tif}
            onChange={e => setTif(e.target.value as TimeInForce)}
            className="w-full rounded-md border border-white/30 bg-black px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="GTC">GTC (Good Till Cancel)</option>
            <option value="IOC">IOC (Immediate Or Cancel)</option>
            <option value="FOK">FOK (Fill Or Kill)</option>
          </select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="mb-2 w-full bg-black"
          disabled={isSubmitting || !price || !size}
        >
          {isSubmitting
            ? "Placing Order..."
            : `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`}
        </Button>

        {/* Total */}
        {price && size && (
          <div className="mb-2 rounded-md bg-black border border-white/30 p-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">
                {(parseFloat(price) * parseFloat(size)).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

