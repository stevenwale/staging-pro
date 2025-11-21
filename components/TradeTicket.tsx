"use client"

import { useState } from "react"
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
      <div className="border-b border-white/30 px-2 py-1">
        <h2>trade</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col p-2">
        {/* Order Type Toggle */}
        <div className="mb-2 flex gap-2">
          <Button
            type="button"
            variant={orderType === "buy" ? "default" : "outline"}
            className="flex-1"
            onClick={() => setOrderType("buy")}
          >
            Buy
          </Button>
          <Button
            type="button"
            variant={orderType === "sell" ? "default" : "outline"}
            className="flex-1"
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
            className="flex-1"
            onClick={() => setOrderSide("yes")}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={orderSide === "no" ? "default" : "outline"}
            className="flex-1"
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
          className="mb-2 w-full"
          disabled={isSubmitting || !price || !size}
        >
          {isSubmitting
            ? "Placing Order..."
            : `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`}
        </Button>

        {/* Total */}
        {price && size && (
          <div className="mb-2 rounded-md bg-muted p-2">
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

