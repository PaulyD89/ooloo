'use client'

import { useState } from 'react'
import { createClient } from '../../lib/supabase'

type Order = {
  id: string
  customer_name: string
  customer_email: string
  delivery_address: string
  return_address: string
  delivery_date: string
  return_date: string
  delivery_window: string
  return_window: string
  subtotal: number
  discount: number
  delivery_fee: number
  tax: number
  total: number
  status: string
  created_at: string
  delivery_city: { name: string } | null
  return_city: { name: string } | null
}

type OrderItem = {
  id: string
  quantity: number
  daily_rate: number
  days: number
  line_total: number
  product: { name: string } | null
}

const STATUS_DISPLAY: Record<string, { label: string; color: string; description: string }> = {
  pending: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Your order is being processed'
  },
  confirmed: { 
    label: 'Confirmed', 
    color: 'bg-blue-100 text-blue-800',
    description: 'Your order is confirmed and scheduled for delivery'
  },
  out_for_delivery: { 
    label: 'Out for Delivery', 
    color: 'bg-purple-100 text-purple-800',
    description: 'Your luggage is on its way!'
  },
  delivered: { 
    label: 'Delivered', 
    color: 'bg-green-100 text-green-800',
    description: 'Your luggage has been delivered. Enjoy your trip!'
  },
  out_for_pickup: { 
    label: 'Pickup Scheduled', 
    color: 'bg-orange-100 text-orange-800',
    description: 'We\'ll pick up your luggage soon'
  },
  returned: { 
    label: 'Completed', 
    color: 'bg-gray-100 text-gray-800',
    description: 'Your rental is complete. Thanks for using ooloo!'
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800',
    description: 'This order has been cancelled'
  }
}

export default function OrderLookupPage() {
  const [email, setEmail] = useState('')
  const [orderId, setOrderId] = useState('')
  const [order, setOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  const supabase = createClient()

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatWindow = (window: string) => {
    const windows: Record<string, string> = {
      morning: '9am - 12pm',
      afternoon: '12pm - 5pm',
      evening: '5pm - 8pm'
    }
    return windows[window] || window
  }

  async function lookupOrder() {
  if (!email || !orderId) {
    setError('Please enter both email and order ID')
    return
  }

  setLoading(true)
  setError('')
  setSearched(true)

  // Clean up inputs
  const cleanEmail = email.trim().toLowerCase()
  const cleanOrderId = orderId.trim().toLowerCase().replace(/-/g, '')

  // First get all orders for this email
  const { data: orders, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      delivery_city:cities!delivery_city_id(name),
      return_city:cities!return_city_id(name)
    `)
    .eq('customer_email', cleanEmail)

  if (fetchError || !orders || orders.length === 0) {
    setError('Order not found. Please check your email and order ID.')
    setOrder(null)
    setOrderItems([])
    setLoading(false)
    return
  }

  // Find the order that matches the partial ID
  const matchedOrder = orders.find(o => 
    o.id.toLowerCase().replace(/-/g, '').includes(cleanOrderId)
  )

  if (!matchedOrder) {
    setError('Order not found. Please check your email and order ID.')
    setOrder(null)
    setOrderItems([])
    setLoading(false)
    return
  }

  setOrder(matchedOrder)

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products!product_id(name)
    `)
    .eq('order_id', matchedOrder.id)

  if (items) setOrderItems(items)

  setLoading(false)
}

  const statusInfo = order ? STATUS_DISPLAY[order.status] || STATUS_DISPLAY.pending : null

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-6">
        <a href="/">
          <img src="/oolooicon.jpg" alt="ooloo" className="h-12" />
        </a>
      </header>

      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-2">Track Your Order</h1>
        <p className="text-gray-600 mb-6">Enter your email and order ID to see your order status</p>

        <div className="bg-white p-6 rounded-lg border mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full p-3 border rounded-lg text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Order ID</label>
              <input
                type="text"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                placeholder="e.g. 3A7B2C1D"
                className="w-full p-3 border rounded-lg text-base font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">Found in your confirmation email</p>
            </div>
          </div>

          {error && (
            <p className="text-red-500 mt-4">{error}</p>
          )}

          <button
            onClick={lookupOrder}
            disabled={loading}
            className="w-full mt-6 bg-black text-white py-4 rounded-lg font-medium disabled:bg-gray-300"
          >
            {loading ? 'Looking up...' : 'Find My Order'}
          </button>
        </div>

        {order && (
          <div className="bg-white rounded-lg border overflow-hidden">
            {/* Status Banner */}
            <div className={`p-6 ${statusInfo?.color}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">{statusInfo?.label}</span>
                <span className="text-sm font-mono opacity-75">#{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <p className="text-sm opacity-90">{statusInfo?.description}</p>
            </div>

            {/* Order Details */}
            <div className="p-6 space-y-6">
              {/* Delivery Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📦</span> Delivery
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{formatDate(order.delivery_date)}</p>
                  <p className="text-gray-600">{formatWindow(order.delivery_window)}</p>
                  <p className="text-gray-600 mt-2">{order.delivery_address}</p>
                </div>
              </div>

              {/* Return Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🔄</span> Return Pickup
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{formatDate(order.return_date)}</p>
                  <p className="text-gray-600">{formatWindow(order.return_window)}</p>
                  <p className="text-gray-600 mt-2">{order.return_address}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>🧳</span> Items
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x {item.product?.name}</span>
                      <span className="font-medium">${(item.line_total / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${(order.subtotal / 100).toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm mb-1 text-green-600">
                    <span>Discount</span>
                    <span>-${(order.discount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Delivery & Pickup</span>
                  <span>${((order.delivery_fee || 1999) / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tax</span>
                  <span>${(order.tax / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${(order.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gray-50 p-6 border-t">
              <p className="text-sm text-gray-600">
                Questions about your order? Email us at{' '}
                <a href="mailto:help@ooloo.co" className="text-cyan-600 hover:underline">
                  help@ooloo.co
                </a>
              </p>
            </div>
          </div>
        )}

        {searched && !order && !loading && !error && (
          <div className="bg-white p-6 rounded-lg border text-center">
            <p className="text-gray-500">No order found</p>
          </div>
        )}
      </div>
    </main>
  )
}