'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  return_address: string
  delivery_date: string
  return_date: string
  delivery_window: string
  return_window: string
  status: string
  delivery_city: { id: string; name: string } | null
  return_city: { id: string; name: string } | null
}

type Driver = {
  id: string
  name: string
  city_id: string
  city: { id: string; name: string } | null
}

export default function DriverPage() {
  const [user, setUser] = useState<User | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (driver?.city_id && selectedDate) {
      loadOrders()
    }
  }, [driver, selectedDate])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
    // Check if user is a driver
    const { data: driverData, error } = await supabase
      .from('drivers')
      .select(`
        *,
        city:cities!city_id(id, name)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !driverData) {
      // Not a driver - check if admin (admins can access with city selector)
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (roleData) {
        // Admin user - redirect to admin page
        router.push('/admin')
      } else {
        // Neither driver nor admin
        setAccessDenied(true)
      }
      setAuthLoading(false)
      return
    }

    setDriver(driverData)
    setAuthLoading(false)
  }

  async function loadOrders() {
    if (!driver?.city_id) return
    
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        delivery_city:cities!delivery_city_id(id, name),
        return_city:cities!return_city_id(id, name)
      `)
      .or(`delivery_date.eq.${selectedDate},return_date.eq.${selectedDate}`)
      .not('status', 'eq', 'cancelled')
      .order('delivery_window', { ascending: true })

    if (data) {
      // Filter to only show orders for driver's city
      const filtered = data.filter(order => 
        (order.delivery_date === selectedDate && order.delivery_city?.id === driver.city_id) ||
        (order.return_date === selectedDate && order.return_city?.id === driver.city_id)
      )
      setOrders(filtered)
    }
    if (error) console.error('Error loading orders:', error)
    setLoading(false)
  }

  async function markDelivered(orderId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'delivered' } : o
      ))
    }
  }

  async function markPickedUp(orderId: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'returned' })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'returned' } : o
      ))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const formatWindow = (window: string) => {
    const windows: Record<string, string> = {
      morning: '9am - 12pm',
      afternoon: '12pm - 5pm',
      evening: '5pm - 8pm'
    }
    return windows[window] || window
  }

  // Separate deliveries and pickups
  const deliveries = orders.filter(o => 
    o.delivery_date === selectedDate && 
    o.delivery_city?.id === driver?.city_id &&
    !['delivered', 'out_for_pickup', 'returned'].includes(o.status)
  )

  const pickups = orders.filter(o => 
    o.return_date === selectedDate && 
    o.return_city?.id === driver?.city_id &&
    ['delivered', 'out_for_pickup'].includes(o.status)
  )

  const completed = orders.filter(o => 
    o.status === 'returned' ||
    (o.delivery_date === selectedDate && o.status === 'delivered' && o.return_date !== selectedDate)
  )

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
          <p className="text-gray-600 mb-6">You don't have driver access. Contact your administrator.</p>
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
      <header className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">ooloo driver</h1>
            <p className="text-sm text-gray-500">{driver?.city?.name}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-3 py-1 text-sm border rounded-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {/* Date Selection */}
        <div className="bg-white p-4 rounded-lg border mb-6">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {loading ? (
          <p className="text-center py-8">Loading...</p>
        ) : (
          <>
            {/* Deliveries */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                Deliveries ({deliveries.length})
              </h2>
              {deliveries.length === 0 ? (
                <p className="text-gray-500 bg-white p-4 rounded-lg border">No deliveries scheduled</p>
              ) : (
                <div className="space-y-4">
                  {deliveries.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {formatWindow(order.delivery_window)}
                        </span>
                      </div>
                      <p className="text-sm mb-4">{order.delivery_address}</p>
                      <button
                        onClick={() => markDelivered(order.id)}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pickups */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">
                Pickups ({pickups.length})
              </h2>
              {pickups.length === 0 ? (
                <p className="text-gray-500 bg-white p-4 rounded-lg border">No pickups scheduled</p>
              ) : (
                <div className="space-y-4">
                  {pickups.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                        <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {formatWindow(order.return_window)}
                        </span>
                      </div>
                      <p className="text-sm mb-4">{order.return_address}</p>
                      <button
                        onClick={() => markPickedUp(order.id)}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-medium"
                      >
                        Mark Picked Up
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-500">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-4 opacity-60">
                  {completed.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <p className="text-sm text-gray-600">{order.customer_phone}</p>
                        </div>
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          ✓ Done
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}