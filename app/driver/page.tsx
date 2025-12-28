'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

type RouteStop = {
  order: Order
  type: 'delivery' | 'pickup'
  address: string
  window: string
  position?: google.maps.LatLngLiteral
}

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export default function DriverPage() {
  const [user, setUser] = useState<User | null>(null)
  const [driver, setDriver] = useState<Driver | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'map' | 'list'>('list')
  const [routeStops, setRouteStops] = useState<RouteStop[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [routeLoading, setRouteLoading] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])

  const router = useRouter()
  const supabase = createClient()

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setMapLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setMapLoaded(true)
    document.head.appendChild(script)

    return () => {
      // Cleanup if needed
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (driver?.city_id && selectedDate) {
      loadOrders()
    }
  }, [driver, selectedDate])

  // Initialize map when tab switches to map and map is loaded
  useEffect(() => {
    if (activeTab === 'map' && mapLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap()
    }
  }, [activeTab, mapLoaded])

  // Update route when orders change and map is visible
  useEffect(() => {
    if (activeTab === 'map' && mapInstanceRef.current && orders.length > 0) {
      calculateRoute()
    }
  }, [activeTab, orders, selectedDate])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    
    setUser(user)
    
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
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

      if (roleData) {
        router.push('/admin')
      } else {
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
      const filtered = data.filter(order => 
        (order.delivery_date === selectedDate && order.delivery_city?.id === driver.city_id) ||
        (order.return_date === selectedDate && order.return_city?.id === driver.city_id)
      )
      setOrders(filtered)
    }
    if (error) console.error('Error loading orders:', error)
    setLoading(false)
  }

  function initializeMap() {
    if (!mapRef.current || !window.google) return

    // Default to LA, will be updated based on orders
    const defaultCenter = { lat: 34.0522, lng: -118.2437 }

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 11,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    directionsRendererRef.current = new google.maps.DirectionsRenderer({
      map: mapInstanceRef.current,
      suppressMarkers: true, // We'll add custom markers
      polylineOptions: {
        strokeColor: '#0891b2',
        strokeWeight: 5
      }
    })
  }

  async function calculateRoute() {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Build stops list - deliveries first (sorted by window), then pickups
    const stops: RouteStop[] = []

    // Add deliveries
    deliveries.forEach(order => {
      stops.push({
        order,
        type: 'delivery',
        address: order.delivery_address,
        window: order.delivery_window
      })
    })

    // Add pickups
    pickups.forEach(order => {
      stops.push({
        order,
        type: 'pickup',
        address: order.return_address,
        window: order.return_window
      })
    })

    if (stops.length === 0) {
      setRouteStops([])
      return
    }

    setRouteLoading(true)

    // Geocode all addresses
    const geocoder = new google.maps.Geocoder()
    const geocodedStops: RouteStop[] = []

    for (const stop of stops) {
      try {
        const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ address: stop.address }, (results, status) => {
            if (status === 'OK' && results) {
              resolve(results)
            } else {
              reject(status)
            }
          })
        })

        if (result[0]) {
          geocodedStops.push({
            ...stop,
            position: {
              lat: result[0].geometry.location.lat(),
              lng: result[0].geometry.location.lng()
            }
          })
        }
      } catch (error) {
        console.error('Geocoding error for:', stop.address, error)
        // Still add the stop without position
        geocodedStops.push(stop)
      }
    }

    setRouteStops(geocodedStops)

    // Add markers for each stop
    geocodedStops.forEach((stop, index) => {
      if (!stop.position || !mapInstanceRef.current) return

      const isCompleted = stop.type === 'delivery' 
        ? ['delivered', 'out_for_pickup', 'returned'].includes(stop.order.status)
        : stop.order.status === 'returned'

      const marker = new google.maps.Marker({
        position: stop.position,
        map: mapInstanceRef.current,
        label: {
          text: String(index + 1),
          color: 'white',
          fontWeight: 'bold'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 18,
          fillColor: isCompleted ? '#9ca3af' : (stop.type === 'delivery' ? '#0891b2' : '#f97316'),
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        }
      })

      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; max-width: 200px;">
            <strong>${stop.order.customer_name}</strong><br/>
            <span style="color: ${stop.type === 'delivery' ? '#0891b2' : '#f97316'}">
              ${stop.type === 'delivery' ? '📦 Delivery' : '🔄 Pickup'}
            </span><br/>
            <small>${formatWindow(stop.window)}</small><br/>
            <small style="color: #666;">${stop.address}</small>
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Calculate optimized route if we have 2+ stops with positions
    const stopsWithPositions = geocodedStops.filter(s => s.position)
    
    if (stopsWithPositions.length >= 2) {
      const directionsService = new google.maps.DirectionsService()

      const origin = stopsWithPositions[0].position!
      const destination = stopsWithPositions[stopsWithPositions.length - 1].position!
      const waypoints = stopsWithPositions.slice(1, -1).map(stop => ({
        location: stop.position!,
        stopover: true
      }))

      try {
        const result = await directionsService.route({
          origin,
          destination,
          waypoints,
          optimizeWaypoints: true, // This optimizes the route!
          travelMode: google.maps.TravelMode.DRIVING
        })

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result)
        }

        // Reorder stops based on optimized route
        if (result.routes[0]?.waypoint_order) {
          const optimizedOrder = result.routes[0].waypoint_order
          const middleStops = stopsWithPositions.slice(1, -1)
          const reorderedMiddle = optimizedOrder.map(i => middleStops[i])
          const optimizedStops = [
            stopsWithPositions[0],
            ...reorderedMiddle,
            stopsWithPositions[stopsWithPositions.length - 1]
          ]
          
          // Update markers with new numbers
          markersRef.current.forEach(marker => marker.setMap(null))
          markersRef.current = []
          
          optimizedStops.forEach((stop, index) => {
            if (!stop.position || !mapInstanceRef.current) return

            const isCompleted = stop.type === 'delivery' 
              ? ['delivered', 'out_for_pickup', 'returned'].includes(stop.order.status)
              : stop.order.status === 'returned'

            const marker = new google.maps.Marker({
              position: stop.position,
              map: mapInstanceRef.current,
              label: {
                text: String(index + 1),
                color: 'white',
                fontWeight: 'bold'
              },
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 18,
                fillColor: isCompleted ? '#9ca3af' : (stop.type === 'delivery' ? '#0891b2' : '#f97316'),
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2
              }
            })

            markersRef.current.push(marker)
          })

          setRouteStops(optimizedStops)
        }
      } catch (error) {
        console.error('Directions error:', error)
      }
    } else if (stopsWithPositions.length === 1) {
      // Just center on the single stop
      mapInstanceRef.current.setCenter(stopsWithPositions[0].position!)
      mapInstanceRef.current.setZoom(14)
    }

    setRouteLoading(false)
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
  // Get order details to check if cross-city return
  const order = orders.find(o => o.id === orderId)
  
  const { error } = await supabase
    .from('orders')
    .update({ status: 'returned' })
    .eq('id', orderId)

  if (!error) {
    // Handle cross-city return - move inventory to return city
    if (order && order.delivery_city?.id !== order.return_city?.id) {
      // Get reservations for this order
      const { data: reservations } = await supabase
        .from('reservations')
        .select('inventory_item_id')
        .eq('order_id', orderId)
      
      if (reservations && reservations.length > 0) {
        // Update inventory items to new city
        const itemIds = reservations.map(r => r.inventory_item_id)
        await supabase
          .from('inventory_items')
          .update({ city_id: order.return_city?.id })
          .in('id', itemIds)
      }
    }
    
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <a href="/">
              <img src="/oolooicon.jpg" alt="ooloo" className="h-10" />
            </a>
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

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        {/* Date Selection */}
        <div className="bg-white p-4 border-b">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />
        </div>

        {/* Tab Switcher */}
        <div className="bg-white border-b flex">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'list' 
                ? 'text-cyan-600 border-b-2 border-cyan-600' 
                : 'text-gray-500'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === 'map' 
                ? 'text-cyan-600 border-b-2 border-cyan-600' 
                : 'text-gray-500'
            }`}
          >
            Map View
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p>Loading...</p>
          </div>
        ) : activeTab === 'list' ? (
          /* List View */
          <div className="flex-1 overflow-y-auto p-4">
            {/* Deliveries */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">📦</span>
                </span>
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
                        <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
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
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🔄</span>
                </span>
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
          </div>
        ) : (
          /* Map View */
          <div className="flex-1 flex flex-col">
            {/* Map */}
            <div 
              ref={mapRef} 
              className="flex-1 min-h-[300px] bg-gray-200"
            >
              {!mapLoaded && (
                <div className="h-full flex items-center justify-center">
                  <p>Loading map...</p>
                </div>
              )}
            </div>

            {/* Route List */}
            <div className="bg-white border-t max-h-[40vh] overflow-y-auto">
              <div className="p-4 border-b bg-gray-50">
                <h3 className="font-semibold">
                  {routeLoading ? 'Calculating route...' : `Optimized Route (${routeStops.length} stops)`}
                </h3>
                <p className="text-sm text-gray-500">
                  <span className="inline-block w-3 h-3 bg-cyan-500 rounded-full mr-1"></span> Delivery
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded-full ml-3 mr-1"></span> Pickup
                </p>
              </div>
              
              {routeStops.length === 0 ? (
                <p className="p-4 text-gray-500">No stops for today</p>
              ) : (
                <div className="divide-y">
                  {routeStops.map((stop, index) => {
                    const isCompleted = stop.type === 'delivery' 
                      ? ['delivered', 'out_for_pickup', 'returned'].includes(stop.order.status)
                      : stop.order.status === 'returned'

                    return (
                      <div 
                        key={`${stop.order.id}-${stop.type}`} 
                        className={`p-4 flex gap-4 ${isCompleted ? 'opacity-50' : ''}`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                            isCompleted 
                              ? 'bg-gray-400' 
                              : stop.type === 'delivery' 
                                ? 'bg-cyan-500' 
                                : 'bg-orange-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{stop.order.customer_name}</p>
                              <p className="text-sm text-gray-500">
                                {stop.type === 'delivery' ? '📦 Delivery' : '🔄 Pickup'} • {formatWindow(stop.window)}
                              </p>
                            </div>
                            {!isCompleted && (
                              <button
                                onClick={() => stop.type === 'delivery' 
                                  ? markDelivered(stop.order.id) 
                                  : markPickedUp(stop.order.id)
                                }
                                className="text-sm bg-green-600 text-white px-3 py-1 rounded"
                              >
                                {stop.type === 'delivery' ? 'Delivered' : 'Picked Up'}
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{stop.address}</p>
                          <a 
                            href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-cyan-600 hover:underline"
                          >
                            Open in Google Maps →
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}