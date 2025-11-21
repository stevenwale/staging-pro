"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

type OrderType = "buy" | "sell"
type OrderSide = "yes" | "no"

export function TradeTicket() {
  const [orderType, setOrderType] = useState<OrderType>("buy")
  const [orderSide, setOrderSide] = useState<OrderSide>("yes")
  const [price, setPrice] = useState("")
  const [size, setSize] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log("Order submitted:", {
      type: orderType,
      side: orderSide,
      price: parseFloat(price),
      size: parseFloat(size),
    })

    setIsSubmitting(false)
    // Reset form
    setPrice("")
    setSize("")
  }

  return (
    <div className="flex h-full flex-col rounded-lg border bg-card">
      <div className="border-b px-2 py-1">
        <h2 className="text-lg font-semibold">trade</h2>
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
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="0.00"
            required
          />
        </div>

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

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-auto w-full"
          disabled={isSubmitting || !price || !size}
        >
          {isSubmitting
            ? "Placing Order..."
            : `${orderType.toUpperCase()} ${orderSide.toUpperCase()}`}
        </Button>
      </form>
    </div>
  )
}

