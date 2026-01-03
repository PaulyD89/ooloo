'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

// SMS sent via API route (twilio can't run client-side)
async function sendDeliveredSMS(phone: string, name: string) {
  try {
    await fetch('/api/sms/delivered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name })
    })
  } catch (e) {
    console.error('SMS error:', e)
  }
}

async function sendPickedUpSMS(phone: string, name: string) {
  try {
    await fetch('/api/sms/picked-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name })
    })
  } catch (e) {
    console.error('SMS error:', e)
  }
}

type OrderItem = {
  id: string
  quantity: number
  product: { name: string } | null
}

type Order = {
  id: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  return_address: string | null
  delivery_date: string
  return_date: string
  delivery_window: string
  return_window: string | null
  status: string
  return_method: string | null
  delivery_city: { id: string; name: string } | null
  return_city: { id: string; name: string } | null
  order_items?: OrderItem[]
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
  const [refreshing, setRefreshing] = useState(false)
  
  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  const pullStartY = useRef(0)
  const listContainerRef = useRef<HTMLDivElement>(null)
  
  // Photo capture state
  const [pendingPhotoOrder, setPendingPhotoOrder] = useState<{ id: string; type: 'delivery' | 'pickup'; name: string } | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  
  // Geolocation state
  const [driverLocation, setDriverLocation] = useState<google.maps.LatLngLiteral | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [trackingEnabled, setTrackingEnabled] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const driverMarkerRef = useRef<google.maps.Marker | null>(null)
  const watchIdRef = useRef<number | null>(null)

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

  // Update driver marker when location changes
  useEffect(() => {
    if (driverLocation && mapInstanceRef.current) {
      updateDriverMarker()
    }
  }, [driverLocation])

  // Cleanup geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  function startLocationTracking() {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setTrackingEnabled(true)
    setLocationError(null)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error))
      },
      { enableHighAccuracy: true }
    )

    // Watch position for updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setDriverLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationError(null)
      },
      (error) => {
        setLocationError(getLocationErrorMessage(error))
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    )
  }

  function stopLocationTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setTrackingEnabled(false)
    
    // Remove driver marker
    if (driverMarkerRef.current) {
      driverMarkerRef.current.setMap(null)
      driverMarkerRef.current = null
    }
  }

  function getLocationErrorMessage(error: GeolocationPositionError): string {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access.'
      case error.POSITION_UNAVAILABLE:
        return 'Location information unavailable.'
      case error.TIMEOUT:
        return 'Location request timed out.'
      default:
        return 'An unknown error occurred.'
    }
  }

  function updateDriverMarker() {
    if (!mapInstanceRef.current || !driverLocation) return

    if (driverMarkerRef.current) {
      // Update existing marker position
      driverMarkerRef.current.setPosition(driverLocation)
    } else {
      // Create new driver marker
      driverMarkerRef.current = new google.maps.Marker({
        position: driverLocation,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3
        },
        title: 'Your Location',
        zIndex: 1000
      })

      // Add pulsing effect with an outer circle
      new google.maps.Marker({
        position: driverLocation,
        map: mapInstanceRef.current,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 20,
          fillColor: '#3b82f6',
          fillOpacity: 0.2,
          strokeColor: '#3b82f6',
          strokeWeight: 1
        },
        zIndex: 999
      })
    }
  }

  function centerOnDriver() {
    if (mapInstanceRef.current && driverLocation) {
      mapInstanceRef.current.setCenter(driverLocation)
      mapInstanceRef.current.setZoom(15)
    }
  }

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
        return_city:cities!return_city_id(id, name),
        order_items(
          id,
          quantity,
          product:products!product_id(name)
        )
      `)
      .or(`delivery_date.eq.${selectedDate},return_date.eq.${selectedDate}`)
      .not('status', 'eq', 'cancelled')
      .order('delivery_window', { ascending: true })

    if (data) {
      const filtered = data.filter(order => 
        (order.delivery_date === selectedDate && order.delivery_city?.id === driver.city_id) ||
        (order.return_date === selectedDate && order.return_city?.id === driver.city_id && order.return_method !== 'ship')
      )
      setOrders(filtered)
    }
    if (error) console.error('Error loading orders:', error)
    setLoading(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    await loadOrders()
    setRefreshing(false)
  }

  function initializeMap() {
    if (!mapRef.current || !window.google) return

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
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#0891b2',
        strokeWeight: 5
      }
    })

    // If tracking was already enabled, show driver location
    if (driverLocation) {
      updateDriverMarker()
    }
  }

  async function calculateRoute() {
    if (!mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    const stops: RouteStop[] = []

    deliveries.forEach(order => {
      stops.push({
        order,
        type: 'delivery',
        address: order.delivery_address,
        window: order.delivery_window
      })
    })

    pickups.forEach(order => {
      if (order.return_address) {
        stops.push({
          order,
          type: 'pickup',
          address: order.return_address,
          window: order.return_window || 'morning'
        })
      }
    })

    if (stops.length === 0) {
      setRouteStops([])
      return
    }

    setRouteLoading(true)

    // Group stops by time window
    const windowOrder = ['morning', 'afternoon', 'evening']
    const stopsByWindow: Record<string, RouteStop[]> = {
      morning: [],
      afternoon: [],
      evening: []
    }
    
    stops.forEach(stop => {
      const window = stop.window || 'morning'
      if (stopsByWindow[window]) {
        stopsByWindow[window].push(stop)
      } else {
        stopsByWindow['morning'].push(stop)
      }
    })

    const geocoder = new google.maps.Geocoder()
    
    // Geocode all stops first
    const geocodeStop = async (stop: RouteStop): Promise<RouteStop> => {
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
          return {
            ...stop,
            position: {
              lat: result[0].geometry.location.lat(),
              lng: result[0].geometry.location.lng()
            }
          }
        }
      } catch (error) {
        console.error('Geocoding error for:', stop.address, error)
      }
      return stop
    }

    // Geocode all stops
    for (const window of windowOrder) {
      const windowStops = stopsByWindow[window]
      for (let i = 0; i < windowStops.length; i++) {
        windowStops[i] = await geocodeStop(windowStops[i])
      }
    }

    // Optimize route within each time window using nearest neighbor algorithm
    const optimizeWindowStops = (windowStops: RouteStop[], startPosition?: google.maps.LatLngLiteral): RouteStop[] => {
      if (windowStops.length <= 1) return windowStops
      
      const stopsWithPos = windowStops.filter(s => s.position)
      const stopsWithoutPos = windowStops.filter(s => !s.position)
      
      if (stopsWithPos.length <= 1) return [...stopsWithPos, ...stopsWithoutPos]
      
      const optimized: RouteStop[] = []
      const remaining = [...stopsWithPos]
      
      // Start from driver location or first stop
      let currentPos = startPosition || remaining[0].position!
      
      while (remaining.length > 0) {
        // Find nearest stop
        let nearestIdx = 0
        let nearestDist = Infinity
        
        for (let i = 0; i < remaining.length; i++) {
          if (!remaining[i].position) continue
          const dist = Math.sqrt(
            Math.pow(remaining[i].position!.lat - currentPos.lat, 2) +
            Math.pow(remaining[i].position!.lng - currentPos.lng, 2)
          )
          if (dist < nearestDist) {
            nearestDist = dist
            nearestIdx = i
          }
        }
        
        const nearest = remaining.splice(nearestIdx, 1)[0]
        optimized.push(nearest)
        currentPos = nearest.position!
      }
      
      return [...optimized, ...stopsWithoutPos]
    }

    // Build final ordered route: morning (optimized) → afternoon (optimized) → evening (optimized)
    let lastPosition = driverLocation || undefined
    const finalOrderedStops: RouteStop[] = []
    
    for (const window of windowOrder) {
      const windowStops = stopsByWindow[window]
      if (windowStops.length > 0) {
        const optimizedWindow = optimizeWindowStops(windowStops, lastPosition)
        finalOrderedStops.push(...optimizedWindow)
        // Update last position for next window's optimization
        const lastStop = optimizedWindow[optimizedWindow.length - 1]
        if (lastStop?.position) {
          lastPosition = lastStop.position
        }
      }
    }

    setRouteStops(finalOrderedStops)

    // Add markers for the ordered stops
    finalOrderedStops.forEach((stop, index) => {
      if (!stop.position || !mapInstanceRef.current) return

      const isCompleted = stop.type === 'delivery' 
        ? ['delivered', 'out_for_pickup', 'returned'].includes(stop.order.status)
        : stop.order.status === 'returned'

      // Color code by window
      const windowColors: Record<string, string> = {
        morning: '#22c55e',    // green
        afternoon: '#f59e0b',  // amber
        evening: '#8b5cf6'     // purple
      }
      const windowColor = windowColors[stop.window] || '#0891b2'

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
          fillColor: isCompleted ? '#9ca3af' : windowColor,
          fillOpacity: 1,
          strokeColor: stop.type === 'pickup' ? '#f97316' : 'white',
          strokeWeight: stop.type === 'pickup' ? 3 : 2
        }
      })

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

    // Draw route using the ordered stops (no optimization - we already ordered them)
    const stopsWithPositions = finalOrderedStops.filter(s => s.position)
    
    if (stopsWithPositions.length >= 2) {
      const directionsService = new google.maps.DirectionsService()

      // Use driver location as origin if available, otherwise use first stop
      const origin = driverLocation || stopsWithPositions[0].position!
      const destination = stopsWithPositions[stopsWithPositions.length - 1].position!
      
      // Don't use optimizeWaypoints - we've already ordered them by window + efficiency
      const waypoints = driverLocation 
        ? stopsWithPositions.map(stop => ({
            location: stop.position!,
            stopover: true
          }))
        : stopsWithPositions.slice(1, -1).map(stop => ({
            location: stop.position!,
            stopover: true
          }))

      try {
        const result = await directionsService.route({
          origin,
          destination,
          waypoints,
          optimizeWaypoints: false, // We already ordered by window + efficiency
          travelMode: google.maps.TravelMode.DRIVING
        })

        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result)
        }
      } catch (error) {
        console.error('Directions error:', error)
      }
    } else if (stopsWithPositions.length === 1) {
      mapInstanceRef.current.setCenter(stopsWithPositions[0].position!)
      mapInstanceRef.current.setZoom(14)
    }

    setRouteLoading(false)
  }

  async function markDelivered(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'delivered' })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'delivered' } : o
      ))
      
      // Send SMS notification
      if (order?.customer_phone) {
        sendDeliveredSMS(order.customer_phone, order.customer_name.split(' ')[0])
      }
    }
  }

  async function confirmAndMarkDelivered(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    
    if (window.confirm(`Mark delivered to ${order.customer_name}?`)) {
      // Trigger photo capture
      setPendingPhotoOrder({ id: orderId, type: 'delivery', name: order.customer_name })
      photoInputRef.current?.click()
    }
  }

  async function markPickedUp(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    
    const { error } = await supabase
      .from('orders')
      .update({ status: 'returned' })
      .eq('id', orderId)

    if (!error) {
      if (order && order.delivery_city?.id !== order.return_city?.id) {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('inventory_item_id')
          .eq('order_id', orderId)
        
        if (reservations && reservations.length > 0) {
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
      
      // Send SMS notification (thank you message)
      if (order?.customer_phone) {
        sendPickedUpSMS(order.customer_phone, order.customer_name.split(' ')[0])
      }
    }
  }

  async function confirmAndMarkPickedUp(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    
    if (window.confirm(`Mark picked up from ${order.customer_name}?`)) {
      // Trigger photo capture
      setPendingPhotoOrder({ id: orderId, type: 'pickup', name: order.customer_name })
      photoInputRef.current?.click()
    }
  }

  async function handlePhotoCapture(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !pendingPhotoOrder) {
      setPendingPhotoOrder(null)
      return
    }

    setUploadingPhoto(true)

    try {
      // Create unique filename
      const timestamp = Date.now()
      const filename = `${pendingPhotoOrder.type}-${pendingPhotoOrder.id}-${timestamp}.jpg`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('proof-photos')
        .upload(filename, file, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload photo. Marking complete anyway.')
      } else {
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('proof-photos')
          .getPublicUrl(filename)

        // Save photo URL to order
        const photoField = pendingPhotoOrder.type === 'delivery' ? 'delivery_photo_url' : 'pickup_photo_url'
        await supabase
          .from('orders')
          .update({ [photoField]: urlData.publicUrl })
          .eq('id', pendingPhotoOrder.id)
      }

      // Mark the order complete
      if (pendingPhotoOrder.type === 'delivery') {
        await markDelivered(pendingPhotoOrder.id)
      } else {
        await markPickedUp(pendingPhotoOrder.id)
      }

    } catch (error) {
      console.error('Photo capture error:', error)
      alert('Error processing photo. Marking complete anyway.')
      
      // Still mark complete even if photo failed
      if (pendingPhotoOrder.type === 'delivery') {
        await markDelivered(pendingPhotoOrder.id)
      } else {
        await markPickedUp(pendingPhotoOrder.id)
      }
    }

    setUploadingPhoto(false)
    setPendingPhotoOrder(null)
    
    // Reset file input
    if (photoInputRef.current) {
      photoInputRef.current.value = ''
    }
  }

  async function handleLogout() {
    stopLocationTracking()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const container = listContainerRef.current
    if (!container || container.scrollTop > 0) return
    
    pullStartY.current = e.touches[0].clientY
    setIsPulling(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return
    const container = listContainerRef.current
    if (!container || container.scrollTop > 0) {
      setIsPulling(false)
      setPullDistance(0)
      return
    }
    
    const currentY = e.touches[0].clientY
    const distance = Math.max(0, (currentY - pullStartY.current) * 0.5)
    setPullDistance(Math.min(distance, 80))
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true)
      await loadOrders()
      setRefreshing(false)
    }
    setIsPulling(false)
    setPullDistance(0)
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

  const formatPhone = (phone: string) => {
    // Format for display but keep raw for tel: link
    return phone
  }

  const getOrderItemsSummary = (order: Order) => {
    if (!order.order_items || order.order_items.length === 0) return null
    return order.order_items
      .map(item => `${item.quantity}x ${item.product?.name || 'Item'}`)
      .join(', ')
  }

  // Sort by time window: morning -> afternoon -> evening
  const windowOrder: Record<string, number> = { morning: 1, afternoon: 2, evening: 3 }
  
  // Filter out ship-back orders from pickups (they ship themselves)
  const deliveries = orders
    .filter(o => 
      o.delivery_date === selectedDate && 
      o.delivery_city?.id === driver?.city_id &&
      !['delivered', 'out_for_pickup', 'returned'].includes(o.status)
    )
    .sort((a, b) => (windowOrder[a.delivery_window] || 99) - (windowOrder[b.delivery_window] || 99))

  const pickups = orders
    .filter(o => 
      o.return_date === selectedDate && 
      o.return_city?.id === driver?.city_id &&
      o.return_method !== 'ship' && // Exclude ship-back orders
      ['delivered', 'out_for_pickup'].includes(o.status)
    )
    .sort((a, b) => (windowOrder[a.return_window || ''] || 99) - (windowOrder[b.return_window || ''] || 99))

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
      {/* Hidden file input for photo capture */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="hidden"
      />
      
      {/* Uploading overlay */}
      {uploadingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg text-center">
            <div className="animate-spin w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="font-medium">Uploading photo...</p>
          </div>
        </div>
      )}
      
      <header className="bg-white border-b p-4">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <a href="/">
              <img src="/oolooicon.png" alt="ooloo" className="h-10" />
            </a>
            <p className="text-sm text-gray-500">{driver?.city?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-3 py-1 text-sm border rounded-lg"
            >
              {refreshing ? '...' : '↻'}
            </button>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 text-sm border rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden">
        {/* Date Selection */}
        <div className="bg-white p-4 border-b">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full p-3 border rounded-lg box-border"
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
          <div 
            ref={listContainerRef}
            className="flex-1 overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Pull-to-refresh indicator */}
            <div 
              className="flex items-center justify-center overflow-hidden transition-all duration-200"
              style={{ height: pullDistance }}
            >
              {refreshing ? (
                <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
              ) : pullDistance > 60 ? (
                <span className="text-cyan-600 text-sm font-medium">Release to refresh</span>
              ) : pullDistance > 0 ? (
                <span className="text-gray-400 text-sm">Pull to refresh</span>
              ) : null}
            </div>
            
            <div className="p-4">
              {/* Summary Banner */}
              <div className="bg-white p-4 rounded-lg border mb-4 flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-cyan-600">{deliveries.length}</p>
                  <p className="text-sm text-gray-500">Deliveries</p>
                </div>
                <div className="border-l"></div>
                <div>
                  <p className="text-2xl font-bold text-orange-500">{pickups.length}</p>
                  <p className="text-sm text-gray-500">Pickups</p>
                </div>
                <div className="border-l"></div>
                <div>
                  <p className="text-2xl font-bold text-gray-400">{completed.length}</p>
                  <p className="text-sm text-gray-500">Done</p>
                </div>
              </div>

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
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <a 
                            href={`tel:${order.customer_phone}`}
                            className="text-sm text-cyan-600 hover:underline"
                          >
                            {order.customer_phone}
                          </a>
                        </div>
                        <span className="text-sm bg-cyan-100 text-cyan-800 px-2 py-1 rounded">
                          {formatWindow(order.delivery_window)}
                        </span>
                      </div>
                      
                      {/* Order Items */}
                      {getOrderItemsSummary(order) && (
                        <p className="text-sm text-gray-600 mb-2 bg-gray-50 px-2 py-1 rounded">
                          🧳 {getOrderItemsSummary(order)}
                        </p>
                      )}
                      
                      <p className="text-sm mb-2">{order.delivery_address}</p>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(order.delivery_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-600 hover:underline block mb-4"
                      >
                        Open in Maps →
                      </a>
                      <button
                        onClick={() => confirmAndMarkDelivered(order.id)}
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
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{order.customer_name}</p>
                          <a 
                            href={`tel:${order.customer_phone}`}
                            className="text-sm text-cyan-600 hover:underline"
                          >
                            {order.customer_phone}
                          </a>
                        </div>
                        <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {formatWindow(order.return_window)}
                        </span>
                      </div>
                      
                      {/* Order Items */}
                      {getOrderItemsSummary(order) && (
                        <p className="text-sm text-gray-600 mb-2 bg-gray-50 px-2 py-1 rounded">
                          🧳 {getOrderItemsSummary(order)}
                        </p>
                      )}
                      
                      <p className="text-sm mb-2">{order.return_address}</p>
                      <a 
                        href={`https://maps.google.com/?q=${encodeURIComponent(order.return_address || '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-600 hover:underline block mb-4"
                      >
                        Open in Maps →
                      </a>
                      <button
                        onClick={() => confirmAndMarkPickedUp(order.id)}
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
                          <a 
                            href={`tel:${order.customer_phone}`}
                            className="text-sm text-gray-500"
                          >
                            {order.customer_phone}
                          </a>
                        </div>
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          ✓ Done
                        </span>
                      </div>
                      {getOrderItemsSummary(order) && (
                        <p className="text-sm text-gray-500 mt-2">
                          🧳 {getOrderItemsSummary(order)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        ) : (
          /* Map View */
          <div className="flex-1 flex flex-col">
            {/* Location Controls */}
            <div className="bg-white p-3 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {!trackingEnabled ? (
                  <button
                    onClick={startLocationTracking}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
                  >
                    <span>📍</span> Location
                  </button>
                ) : (
                  <>
                    <span className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></span>
                    <span className="text-sm text-gray-600">Tracking</span>
                    <button
                      onClick={centerOnDriver}
                      className="px-2 py-1 border rounded-lg text-xs"
                    >
                      Center
                    </button>
                    <button
                      onClick={stopLocationTracking}
                      className="px-2 py-1 border border-red-200 text-red-600 rounded-lg text-xs"
                    >
                      Stop
                    </button>
                  </>
                )}
              </div>
              
              {routeStops.length > 0 && (
                <button
                  onClick={() => {
                    const stops = routeStops.filter(s => {
                      const isCompleted = s.type === 'delivery' 
                        ? ['delivered', 'out_for_pickup', 'returned'].includes(s.order.status)
                        : s.order.status === 'returned'
                      return !isCompleted
                    })
                    
                    if (stops.length === 0) {
                      alert('All stops completed!')
                      return
                    }
                    
                    const destination = encodeURIComponent(stops[stops.length - 1].address)
                    const waypoints = stops.slice(0, -1).map(s => encodeURIComponent(s.address)).join('|')
                    
                    let url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`
                    if (waypoints) {
                      url += `&waypoints=${waypoints}`
                    }
                    url += '&travelmode=driving'
                    
                    window.open(url, '_blank')
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium"
                >
                  <span>🧭</span> Navigate
                </button>
              )}
            </div>
            
            {locationError && (
              <div className="bg-red-50 text-red-700 p-3 text-sm">
                {locationError}
              </div>
            )}

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
                  {routeLoading ? 'Calculating route...' : `Route (${routeStops.length} stops)`}
                </h3>
                <p className="text-sm text-gray-500">
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span> Morning
                  <span className="inline-block w-3 h-3 bg-amber-500 rounded-full ml-3 mr-1"></span> Afternoon
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full ml-3 mr-1"></span> Evening
                  {trackingEnabled && (
                    <>
                      <span className="inline-block w-3 h-3 bg-blue-500 rounded-full ml-3 mr-1"></span> You
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Orange border = pickup
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

                    const windowColors: Record<string, string> = {
                      morning: 'bg-green-500',
                      afternoon: 'bg-amber-500',
                      evening: 'bg-purple-500'
                    }
                    const windowColorClass = windowColors[stop.window] || 'bg-cyan-500'

                    return (
                      <div 
                        key={`${stop.order.id}-${stop.type}`} 
                        className={`p-4 flex gap-4 ${isCompleted ? 'opacity-50' : ''}`}
                      >
                        <div 
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                            isCompleted 
                              ? 'bg-gray-400' 
                              : windowColorClass
                          } ${stop.type === 'pickup' && !isCompleted ? 'ring-2 ring-orange-500' : ''}`}
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
                          <div className="flex gap-3 mt-1">
                            <a 
                              href={`tel:${stop.order.customer_phone}`}
                              className="text-sm text-cyan-600 hover:underline"
                            >
                              Call
                            </a>
                            <a 
                              href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cyan-600 hover:underline"
                            >
                              Maps →
                            </a>
                          </div>
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