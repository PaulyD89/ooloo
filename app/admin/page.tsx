'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type OrderItem = {
  id: string
  quantity: number
  daily_rate: number
  days: number
  line_total: number
  product: { name: string } | null
}

type Order = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  delivery_address: string
  return_address: string | null
  delivery_date: string
  return_date: string
  delivery_window: string
  return_window: string | null
  subtotal: number
  discount: number
  early_bird_discount: number
  promo_discount: number
  rush_fee: number
  delivery_fee: number
  tax: number
  total: number
  status: string
  created_at: string
  return_method: string | null
  ship_back_fee: number | null
  ship_back_address: string | null
  ship_back_city: string | null
  ship_back_state: string | null
  ship_back_zip: string | null
  ups_tracking_number: string | null
  ups_label_url: string | null
  delivery_city: { name: string } | null
  return_city: { name: string } | null
  order_items?: OrderItem[]
}

type InventoryAlert = {
  date: string
  city_name: string
  product_name: string
  available: number
  total: number
}

const STATUS_OPTIONS = [
  'pending',
  'confirmed',
  'out_for_delivery',
  'delivered',
  'out_for_pickup',
  'returned',
  'cancelled'
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  out_for_pickup: 'bg-orange-100 text-orange-800',
  returned: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
}

const LOW_INVENTORY_THRESHOLD = 3

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today_delivery' | 'today_pickup' | 'custom'>('all')
  const [customDate, setCustomDate] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(true)
  
  const router = useRouter()
  const supabase = createClient()

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      loadOrderItems(selectedOrder.id)
    }
  }, [selectedOrder])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
    const { data: roleData, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (error || !roleData) {
      const { data: driverData } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (driverData) {
        router.push('/driver')
      } else {
        setAccessDenied(true)
        setAuthLoading(false)
      }
      return
    }

    setAuthLoading(false)
    loadOrders()
    loadInventoryAlerts()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function loadOrders() {
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        delivery_city:cities!delivery_city_id(name),
        return_city:cities!return_city_id(name)
      `)
      .order('created_at', { ascending: false })

    if (data) setOrders(data)
    if (error) console.error('Error loading orders:', error)
    setLoading(false)
  }

  async function loadInventoryAlerts() {
    setAlertsLoading(true)
    
    const [citiesRes, productsRes, inventoryRes] = await Promise.all([
      supabase.from('cities').select('id, name').eq('is_active', true),
      supabase.from('products').select('id, name, slug').eq('is_active', true),
      supabase.from('inventory_items').select('id, city_id, product_id, status')
    ])

    const cities = citiesRes.data || []
    const products = (productsRes.data || []).filter(p => p.slug !== 'set')
    const inventory = inventoryRes.data || []

    const alerts: InventoryAlert[] = []
    const todayDate = new Date()
    
    for (let i = 0; i < 14; i++) {
      const checkDate = new Date(todayDate)
      checkDate.setDate(todayDate.getDate() + i)
      const dateStr = checkDate.toISOString().split('T')[0]
      
      const { data: reservations } = await supabase
        .from('reservations')
        .select('inventory_item_id')
        .lte('start_date', dateStr)
        .gte('end_date', dateStr)
      
      const reservedItemIds = new Set(reservations?.map(r => r.inventory_item_id) || [])
      
      for (const city of cities) {
        for (const product of products) {
          const totalItems = inventory.filter(
            i => i.city_id === city.id && i.product_id === product.id && i.status === 'available'
          )
          const reservedCount = totalItems.filter(i => reservedItemIds.has(i.id)).length
          const available = totalItems.length - reservedCount
          
          if (available <= LOW_INVENTORY_THRESHOLD) {
            alerts.push({
              date: dateStr,
              city_name: city.name,
              product_name: product.name,
              available,
              total: totalItems.length
            })
          }
        }
      }
    }
    
    setInventoryAlerts(alerts)
    setAlertsLoading(false)
  }

  async function loadOrderItems(orderId: string) {
    setLoadingItems(true)
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        product:products!product_id(name)
      `)
      .eq('order_id', orderId)

    if (data) setOrderItems(data)
    if (error) console.error('Error loading order items:', error)
    setLoadingItems(false)
  }

  async function updateStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus })
      }
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (filter !== 'all' && order.status !== filter) return false
    
    // Date filter
    if (dateFilter === 'today_delivery' && order.delivery_date !== today) return false
    if (dateFilter === 'today_pickup' && order.return_date !== today) return false
    if (dateFilter === 'custom' && customDate) {
      if (order.delivery_date !== customDate && order.return_date !== customDate) return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesName = order.customer_name.toLowerCase().includes(query)
      const matchesEmail = order.customer_email.toLowerCase().includes(query)
      const matchesId = order.id.toLowerCase().includes(query.replace(/-/g, ''))
      const matchesPhone = order.customer_phone?.includes(query)
      if (!matchesName && !matchesEmail && !matchesId && !matchesPhone) return false
    }
    
    return true
  })

  // Count today's orders
  const todayDeliveries = orders.filter(o => o.delivery_date === today && !['cancelled', 'returned'].includes(o.status)).length
  const todayPickups = orders.filter(o => o.return_date === today && !['cancelled', 'pending', 'confirmed'].includes(o.status)).length

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatAlertDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const tomorrow = new Date(todayDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.getTime() === todayDate.getTime()) return 'Today'
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatWindow = (window: string | null) => {
    if (!window) return 'N/A'
    const windows: Record<string, string> = {
      morning: '9am - 12pm',
      afternoon: '12pm - 5pm',
      evening: '5pm - 8pm'
    }
    return windows[window] || window
  }

  const alertsByDate = inventoryAlerts.reduce((acc, alert) => {
    if (!acc[alert.date]) acc[alert.date] = []
    acc[alert.date].push(alert)
    return acc
  }, {} as Record<string, InventoryAlert[]>)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg border text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have admin access. Contact your administrator.</p>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 border rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <a href="/">
              <img src="/oolooicon.png" alt="ooloo" className="h-12" />
            </a>
            <nav className="flex gap-4">
              <span className="font-medium text-black">Orders</span>
              <a href="/admin/inventory" className="text-gray-500 hover:text-black">Inventory</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.email}</span>
            <button 
              onClick={() => { loadOrders(); loadInventoryAlerts(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Refresh
            </button>
            <button 
              onClick={handleLogout}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {/* Today's Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => { setDateFilter('today_delivery'); setFilter('all'); }}
            className={`p-4 rounded-lg border text-left transition ${dateFilter === 'today_delivery' ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'}`}
          >
            <p className="text-sm text-gray-500">Today's Deliveries</p>
            <p className="text-2xl font-bold">{todayDeliveries}</p>
          </button>
          <button
            onClick={() => { setDateFilter('today_pickup'); setFilter('all'); }}
            className={`p-4 rounded-lg border text-left transition ${dateFilter === 'today_pickup' ? 'bg-orange-50 border-orange-300' : 'bg-white hover:bg-gray-50'}`}
          >
            <p className="text-sm text-gray-500">Today's Pickups</p>
            <p className="text-2xl font-bold">{todayPickups}</p>
          </button>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold">{orders.length}</p>
          </div>
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-sm text-gray-500">Active Rentals</p>
            <p className="text-2xl font-bold">{orders.filter(o => o.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Inventory Alerts */}
        {!alertsLoading && inventoryAlerts.length > 0 && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
              <span>⚠️</span> Low Inventory Alerts (Next 14 Days)
            </h3>
            <div className="space-y-3">
              {Object.entries(alertsByDate).slice(0, 5).map(([date, alerts]) => (
                <div key={date} className="bg-white rounded-lg p-3 border border-orange-100">
                  <p className="font-medium text-sm text-orange-900 mb-2">{formatAlertDate(date)}</p>
                  <div className="grid gap-2">
                    {alerts.map((alert, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">
                          {alert.product_name} - {alert.city_name}
                        </span>
                        <span className={`font-medium ${alert.available === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {alert.available === 0 ? 'SOLD OUT' : `${alert.available} left`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(alertsByDate).length > 5 && (
                <p className="text-sm text-orange-600">
                  + {Object.keys(alertsByDate).length - 5} more dates with low inventory
                </p>
              )}
            </div>
          </div>
        )}

        {/* Search and Date Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name, email, phone, or order ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="p-3 border rounded-lg bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today_delivery">Today's Deliveries</option>
              <option value="today_pickup">Today's Pickups</option>
              <option value="custom">Custom Date</option>
            </select>
            {dateFilter === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                className="p-3 border rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-black text-white' : 'bg-white border'}`}
          >
            All ({orders.length})
          </button>
          {STATUS_OPTIONS.map(status => {
            const count = orders.filter(o => o.status === status).length
            if (count === 0) return null
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize ${filter === status ? 'bg-black text-white' : 'bg-white border'}`}
              >
                {status.replace(/_/g, ' ')} ({count})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery || dateFilter !== 'all' ? 'No orders match your filters' : 'No orders found'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map(order => (
              <div 
                key={order.id} 
                className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{order.customer_name}</h3>
                    <p className="text-sm text-gray-500">{order.customer_email}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.return_method === 'ship' && (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        📦 UPS Ship Back
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${STATUS_COLORS[order.status]}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Delivery</p>
                    <p className={`font-medium ${order.delivery_date === today ? 'text-purple-600' : ''}`}>
                      {order.delivery_date === today ? '📍 TODAY' : formatDate(order.delivery_date)}
                    </p>
                    <p>{order.delivery_city?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Return</p>
                    <p className={`font-medium ${order.return_date === today ? 'text-orange-600' : ''}`}>
                      {order.return_date === today ? '📍 TODAY' : formatDate(order.return_date)}
                    </p>
                    <p>{order.return_method === 'ship' ? 'UPS Ship Back' : order.return_city?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-medium">${(order.total / 100).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selectedOrder.customer_name}</h2>
                <p className="text-sm text-gray-500 font-mono">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedOrder(null)
                  setOrderItems([])
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status update */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={selectedOrder.status}
                  onChange={e => updateStatus(selectedOrder.id, e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer info */}
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <p>{selectedOrder.customer_name}</p>
                <p className="text-gray-600">{selectedOrder.customer_email}</p>
                <p className="text-gray-600">{selectedOrder.customer_phone}</p>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Items</h3>
                {loadingItems ? (
                  <p className="text-gray-500">Loading items...</p>
                ) : orderItems.length === 0 ? (
                  <p className="text-gray-500">No items found</p>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {orderItems.map(item => (
                      <div key={item.id} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} × ${(item.daily_rate / 100).toFixed(2)}/day × {item.days} days
                          </p>
                        </div>
                        <p className="font-medium">${(item.line_total / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">📦 Delivery</h3>
                  <p className={`font-medium ${selectedOrder.delivery_date === today ? 'text-purple-600' : ''}`}>
                    {selectedOrder.delivery_date === today ? '📍 TODAY - ' : ''}{formatDate(selectedOrder.delivery_date)}
                  </p>
                  <p className="text-gray-600">{formatWindow(selectedOrder.delivery_window)}</p>
                  <p className="mt-2">{selectedOrder.delivery_address}</p>
                  <p className="text-gray-600">{selectedOrder.delivery_city?.name}</p>
                </div>
                
                {/* Return info - different for ship-back vs pickup */}
                {selectedOrder.return_method === 'ship' ? (
                  <div>
                    <h3 className="font-semibold mb-2">📦 UPS Ship Back</h3>
                    <p className={`font-medium ${selectedOrder.return_date === today ? 'text-orange-600' : ''}`}>
                      Return by: {selectedOrder.return_date === today ? '📍 TODAY - ' : ''}{formatDate(selectedOrder.return_date)}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">Customer drop-off location:</p>
                    <p>{selectedOrder.ship_back_address}</p>
                    <p>{selectedOrder.ship_back_city}, {selectedOrder.ship_back_state} {selectedOrder.ship_back_zip}</p>
                    
                    {selectedOrder.ups_tracking_number && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">UPS Tracking</p>
                        <a 
                          href={`https://www.ups.com/track?tracknum=${selectedOrder.ups_tracking_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline font-mono text-sm"
                        >
                          {selectedOrder.ups_tracking_number}
                        </a>
                      </div>
                    )}
                    
                    {selectedOrder.ups_label_url && (
                      <a 
                        href={selectedOrder.ups_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                      >
                        View Shipping Label →
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold mb-2">🔄 Return Pickup</h3>
                    <p className={`font-medium ${selectedOrder.return_date === today ? 'text-orange-600' : ''}`}>
                      {selectedOrder.return_date === today ? '📍 TODAY - ' : ''}{formatDate(selectedOrder.return_date)}
                    </p>
                    <p className="text-gray-600">{formatWindow(selectedOrder.return_window)}</p>
                    <p className="mt-2">{selectedOrder.return_address}</p>
                    <p className="text-gray-600">{selectedOrder.return_city?.name}</p>
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${(selectedOrder.subtotal / 100).toFixed(2)}</span>
                </div>
                {(selectedOrder.discount > 0 || selectedOrder.early_bird_discount > 0 || selectedOrder.promo_discount > 0) && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${((selectedOrder.discount || selectedOrder.early_bird_discount + selectedOrder.promo_discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {selectedOrder.return_method === 'ship' ? 'Delivery Fee' : 'Delivery & Pickup'}
                  </span>
                  <span>${((selectedOrder.delivery_fee || 1999) / 100).toFixed(2)}</span>
                </div>
                {selectedOrder.ship_back_fee && selectedOrder.ship_back_fee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">UPS Ship Back Fee</span>
                    <span>${(selectedOrder.ship_back_fee / 100).toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.rush_fee && selectedOrder.rush_fee > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Rush Fee</span>
                    <span>${(selectedOrder.rush_fee / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${(selectedOrder.tax / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                  <span>Total</span>
                  <span>${(selectedOrder.total / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}