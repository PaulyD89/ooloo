'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../lib/supabase'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' },
]

type City = {
  id: string
  name: string
  slug: string
  tax_rate: number
}

type Product = {
  id: string
  name: string
  slug: string
  description: string
  daily_rate: number
  image_url: string | null
}

type PromoCode = {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_order_total: number | null
}

type Addon = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image_url: string | null
  quantity_available: number
}

// Pricing constants
const EARLY_BIRD_DAYS = 60
const EARLY_BIRD_DISCOUNT_PERCENT = 10
const RUSH_FEE = 999 // $9.99 in cents
const DELIVERY_FEE_STANDARD = 1999 // $19.99 for round-trip (delivery + pickup)
const DELIVERY_FEE_ONE_WAY = 999 // $9.99 for one-way (delivery only)
const SHIP_BACK_FEE = 2999 // $29.99 flat rate for UPS ship back
const SHIP_BACK_OPTION_ID = 'ups-ship-back' // Special ID for the ship back option

function CheckoutForm({ orderId }: { orderId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation?order=${orderId}`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <p className="text-red-500 mt-4">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-6 bg-black text-white py-4 rounded-lg font-medium disabled:bg-gray-300"
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}

function ImageGallery({ product, onClose }: { product: Product, onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState(0)
  
  const baseUrl = product.image_url?.replace('-front.jpg', '') || ''
  const images = product.slug === 'set' 
    ? [{ url: `${baseUrl}-front.jpg`, label: 'Front' }]
    : [
        { url: `${baseUrl}-front.jpg`, label: 'Front' },
        { url: `${baseUrl}-side.jpg`, label: 'Side' },
        { url: `${baseUrl}-inside.jpg`, label: 'Inside' },
        { url: `${baseUrl}-scale.jpg`, label: 'Scale' },
      ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
          <h3 className="font-semibold text-lg">{product.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>
        
        <div className="p-4">
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={images[selectedImage].url}
              alt={`${product.name} - ${images[selectedImage].label}`}
              className="w-full h-full object-contain"
            />
          </div>
          
          {images.length > 1 && (
            <div className="flex gap-2 justify-center">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index ? 'border-black' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.label}
                    className="w-full h-full object-contain"
                  />
                </button>
              ))}
            </div>
          )}
          
          <p className="text-center text-sm text-gray-500 mt-3">
            {images[selectedImage].label} View
          </p>
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  const [step, setStep] = useState(1)
  const [cities, setCities] = useState<City[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [addons, setAddons] = useState<Addon[]>([])
  const [galleryProduct, setGalleryProduct] = useState<Product | null>(null)
  const [galleryAddon, setGalleryAddon] = useState<Addon | null>(null)
  
  const [deliveryCitySelect, setDeliveryCitySelect] = useState('')
  const [returnCitySelect, setReturnCitySelect] = useState('')
  const [isShipBack, setIsShipBack] = useState(false)
  const [shipBackStreet, setShipBackStreet] = useState('')
  const [shipBackCity, setShipBackCity] = useState('')
  const [shipBackState, setShipBackState] = useState('')
  const [shipBackZip, setShipBackZip] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [addonCart, setAddonCart] = useState<Record<string, number>>({})
  
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryStreet, setDeliveryStreet] = useState('')
  const [deliveryCityAddress, setDeliveryCityAddress] = useState('')
  const [deliveryState, setDeliveryState] = useState('')
  const [deliveryZip, setDeliveryZip] = useState('')
  const [returnStreet, setReturnStreet] = useState('')
  const [returnCityAddress, setReturnCityAddress] = useState('')
  const [returnState, setReturnState] = useState('')
  const [returnZip, setReturnZip] = useState('')
  const [deliveryWindow, setDeliveryWindow] = useState('morning')
  const [returnWindow, setReturnWindow] = useState('morning')
  const [sameAsDelivery, setSameAsDelivery] = useState(false)

  const [promoCodeInput, setPromoCodeInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState('')

  const [availability, setAvailability] = useState<Record<string, number>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const [citiesRes, productsRes, addonsRes] = await Promise.all([
        supabase.from('cities').select('*').eq('is_active', true),
        supabase.from('products').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('addons').select('*').eq('is_active', true)
      ])
      
      if (citiesRes.data) setCities(citiesRes.data)
      if (productsRes.data) setProducts(productsRes.data)
      if (addonsRes.data) setAddons(addonsRes.data)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (sameAsDelivery) {
      setReturnStreet(deliveryStreet)
      setReturnCityAddress(deliveryCityAddress)
      setReturnState(deliveryState)
      setReturnZip(deliveryZip)
    }
  }, [sameAsDelivery, deliveryStreet, deliveryCityAddress, deliveryState, deliveryZip])

  useEffect(() => {
    if (step === 2 && deliveryCitySelect && deliveryDate && returnDate) {
      checkAvailability()
    }
  }, [step, deliveryCitySelect, deliveryDate, returnDate])

  const checkAvailability = async () => {
    if (!deliveryCitySelect || !deliveryDate || !returnDate) return
    
    setAvailabilityLoading(true)
    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cityId: deliveryCitySelect,
          deliveryDate,
          returnDate
        })
      })
      const data = await response.json()
      if (data.availability) {
        setAvailability(data.availability)
      }
    } catch (error) {
      console.error('Failed to check availability:', error)
    }
    setAvailabilityLoading(false)
  }

  const days = deliveryDate && returnDate 
    ? Math.max(1, Math.ceil((new Date(returnDate).getTime() - new Date(deliveryDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Calculate days until delivery for Early Bird / Rush Fee
  const getDaysUntilDelivery = () => {
    if (!deliveryDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const delivery = new Date(deliveryDate)
    delivery.setHours(0, 0, 0, 0)
    const diffTime = delivery.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const daysUntilDelivery = getDaysUntilDelivery()
  const isEarlyBird = daysUntilDelivery !== null && daysUntilDelivery >= EARLY_BIRD_DAYS
  const isRushOrder = daysUntilDelivery !== null && daysUntilDelivery <= 1

  const selectedCity = cities.find(c => c.id === deliveryCitySelect)
  const taxRate = selectedCity?.tax_rate || 0.095

  // Rental subtotal
  const rentalSubtotal = products.reduce((sum, product) => {
    const qty = cart[product.id] || 0
    return sum + (qty * product.daily_rate * days)
  }, 0)

  // Add-ons subtotal
  const addonsSubtotal = addons.reduce((sum, addon) => {
    const qty = addonCart[addon.id] || 0
    return sum + (qty * addon.price)
  }, 0)

  const subtotal = rentalSubtotal + addonsSubtotal

  // Early Bird discount (10% off rental subtotal only, not add-ons)
  const earlyBirdDiscount = isEarlyBird ? Math.round(rentalSubtotal * (EARLY_BIRD_DISCOUNT_PERCENT / 100)) : 0

  // Promo code discount (applied after Early Bird, on rental subtotal only)
  const rentalAfterEarlyBird = rentalSubtotal - earlyBirdDiscount
  const promoDiscount = appliedPromo
    ? appliedPromo.discount_type === 'percent'
      ? Math.round(rentalAfterEarlyBird * (appliedPromo.discount_value / 100))
      : appliedPromo.discount_value
    : 0

  // Total discount for display
  const totalDiscount = earlyBirdDiscount + promoDiscount

  // Rush fee
  const rushFee = isRushOrder ? RUSH_FEE : 0

  // Delivery and ship back fees
  const deliveryFee = isShipBack ? DELIVERY_FEE_ONE_WAY : DELIVERY_FEE_STANDARD
  const shipBackFee = isShipBack ? SHIP_BACK_FEE : 0
  
  const subtotalAfterDiscounts = rentalSubtotal - totalDiscount + addonsSubtotal
  const taxableAmount = subtotalAfterDiscounts + deliveryFee + shipBackFee + rushFee
  const tax = Math.round(taxableAmount * taxRate)
  const total = subtotalAfterDiscounts + deliveryFee + shipBackFee + rushFee + tax

  const updateCart = (productId: string, delta: number) => {
    const product = products.find(p => p.id === productId)
    
    setCart(prev => {
      const currentQty = prev[productId] || 0
      const newQty = currentQty + delta
      
      let maxAvailable = availability[productId] ?? 999
      
      // For sets, also check carryon and large availability
      if (product?.slug === 'set') {
        const carryonProduct = products.find(p => p.slug === 'carryon')
        const largeProduct = products.find(p => p.slug === 'large')
        if (carryonProduct && largeProduct) {
          const carryonAvail = (availability[carryonProduct.id] ?? 999) - (prev[carryonProduct.id] || 0)
          const largeAvail = (availability[largeProduct.id] ?? 999) - (prev[largeProduct.id] || 0)
          maxAvailable = Math.min(maxAvailable, carryonAvail, largeAvail)
        }
      }
      
      return {
        ...prev,
        [productId]: Math.max(0, Math.min(newQty, maxAvailable))
      }
    })
  }

  const updateAddonCart = (addonId: string, delta: number) => {
    const addon = addons.find(a => a.id === addonId)
    if (!addon) return

    setAddonCart(prev => {
      const currentQty = prev[addonId] || 0
      const newQty = currentQty + delta
      return {
        ...prev,
        [addonId]: Math.max(0, Math.min(newQty, addon.quantity_available))
      }
    })
  }

  const applyPromoCode = async () => {
    if (!promoCodeInput.trim()) return
    
    setPromoLoading(true)
    setPromoError('')
    
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoCodeInput.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !data) {
      setPromoError('Invalid promo code')
      setPromoLoading(false)
      return
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      setPromoError('This promo code has expired')
      setPromoLoading(false)
      return
    }

    if (data.usage_limit && data.times_used >= data.usage_limit) {
      setPromoError('This promo code has reached its usage limit')
      setPromoLoading(false)
      return
    }

    if (data.min_order_total && rentalSubtotal < data.min_order_total) {
      setPromoError(`Minimum order of $${(data.min_order_total / 100).toFixed(2)} required`)
      setPromoLoading(false)
      return
    }

    setAppliedPromo(data)
    setPromoLoading(false)
  }

  const removePromoCode = () => {
    setAppliedPromo(null)
    setPromoCodeInput('')
    setPromoError('')
  }

  // For ship-back, we don't need return address (already collected in Step 1)
  const isStep3Valid = customerName && customerEmail && customerPhone && 
    deliveryStreet && deliveryCityAddress && deliveryState && deliveryZip &&
    (isShipBack || (returnStreet && returnCityAddress && returnState && returnZip))

  const handleCheckout = async () => {
    const fullDeliveryAddress = `${deliveryStreet}, ${deliveryCityAddress}, ${deliveryState} ${deliveryZip}`
    const fullReturnAddress = isShipBack ? '' : `${returnStreet}, ${returnCityAddress}, ${returnState} ${returnZip}`

    const cartDetails: Record<string, any> = {}
    products.forEach(product => {
      const qty = cart[product.id] || 0
      if (qty > 0) {
        cartDetails[product.id] = {
          quantity: qty,
          dailyRate: product.daily_rate,
          days: days
        }
      }
    })

    // Build addons cart for API
    const addonDetails: Record<string, { quantity: number; price: number }> = {}
    addons.forEach(addon => {
      const qty = addonCart[addon.id] || 0
      if (qty > 0) {
        addonDetails[addon.id] = {
          quantity: qty,
          price: addon.price
        }
      }
    })

    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail,
        customerName,
        customerPhone,
        deliveryAddress: fullDeliveryAddress,
        deliveryCityId: deliveryCitySelect,
        returnAddress: isShipBack ? null : fullReturnAddress,
        returnCityId: isShipBack ? null : returnCitySelect,
        deliveryDate,
        returnDate,
        deliveryWindow,
        returnWindow: isShipBack ? null : returnWindow,
        cart: cartDetails,
        addons: addonDetails,
        rentalSubtotal,
        addonsSubtotal,
        subtotal,
        earlyBirdDiscount,
        promoDiscount,
        rushFee,
        deliveryFee,
        shipBackFee,
        tax,
        total,
        promoCodeId: appliedPromo?.id || null,
        // Ship back fields
        isShipBack,
        shipBackAddress: isShipBack ? shipBackStreet : null,
        shipBackCity: isShipBack ? shipBackCity : null,
        shipBackState: isShipBack ? shipBackState : null,
        shipBackZip: isShipBack ? shipBackZip : null
      })
    })

    const data = await response.json()
    
    if (data.clientSecret) {
      setClientSecret(data.clientSecret)
      setOrderId(data.orderId)
      setStep(4)
    } else {
      alert('Error creating order: ' + data.error)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <header className="p-6 border-b">
        <a href="/">
          <img 
            src="/oolooicon.png" 
            alt="ooloo" 
            className="h-12"
          />
        </a>
      </header>

      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`h-2 flex-1 rounded ${s <= step ? 'bg-black' : 'bg-gray-200'}`} 
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Where and when?</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Delivery City</label>
                <select 
                  value={deliveryCitySelect}
                  onChange={e => setDeliveryCitySelect(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Return City</label>
                <select 
                  value={isShipBack ? SHIP_BACK_OPTION_ID : returnCitySelect}
                  onChange={e => {
                    if (e.target.value === SHIP_BACK_OPTION_ID) {
                      setIsShipBack(true)
                      setReturnCitySelect('')
                    } else {
                      setIsShipBack(false)
                      setReturnCitySelect(e.target.value)
                    }
                  }}
                  className="w-full p-3 border rounded-lg"
                >
                  <option value="">Select a city</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                  <option value={SHIP_BACK_OPTION_ID}>📦 Other (UPS Ship Back)</option>
                </select>
                {isShipBack && (
                  <p className="text-sm text-blue-600 mt-2">
                    We'll include a prepaid UPS label. Just drop off at any UPS location!
                  </p>
                )}
              </div>

              {/* Ship Back Address - only show when UPS Ship Back is selected */}
              {isShipBack && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <h4 className="font-medium text-blue-800">Where will you drop off at UPS?</h4>
                  <p className="text-sm text-blue-600">Enter the address where you'll be when returning the luggage. We'll find the nearest UPS location for you.</p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input 
                      type="text" 
                      value={shipBackStreet}
                      onChange={e => setShipBackStreet(e.target.value)}
                      className="w-full p-3 border rounded-lg" 
                      placeholder="123 Main St" 
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input 
                        type="text" 
                        value={shipBackCity}
                        onChange={e => setShipBackCity(e.target.value)}
                        className="w-full p-3 border rounded-lg" 
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-2">State</label>
                      <select
                        value={shipBackState}
                        onChange={e => setShipBackState(e.target.value)}
                        className="w-full p-3 border rounded-lg h-[50px]"
                      >
                        <option value=""></option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>{state.code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">ZIP</label>
                      <input 
                        type="text" 
                        value={shipBackZip}
                        onChange={e => setShipBackZip(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Delivery Date</label>
                <input 
                  type="date"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="w-full p-3 border rounded-lg text-base appearance-none min-w-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Return Date</label>
                <input 
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full p-3 border rounded-lg text-base appearance-none min-w-0"
                />
              </div>
            </div>

            {/* Early Bird / Rush Fee indicator on step 1 */}
            {deliveryDate && (
              <div className="mt-4">
                {isEarlyBird && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-800 font-medium">🎉 Early Bird Discount!</span>
                    <span className="text-green-600 ml-2">Book 60+ days ahead and save 10%</span>
                  </div>
                )}
                {isRushOrder && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-800 font-medium">⚡ Rush Order</span>
                    <span className="text-amber-600 ml-2">A $9.99 rush fee applies for next-day delivery</span>
                  </div>
                )}
              </div>
            )}

            {/* Ship Back pricing info */}
            {isShipBack && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-blue-800 font-medium">📦 UPS Ship Back</span>
                <span className="text-blue-600 ml-2">$9.99 delivery + $29.99 ship back fee (includes prepaid label & poly bag)</span>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={
                !deliveryCitySelect || 
                !deliveryDate || 
                !returnDate || 
                (!returnCitySelect && !isShipBack) ||
                (isShipBack && (!shipBackStreet || !shipBackCity || !shipBackState || !shipBackZip))
              }
              className="w-full mt-8 bg-black text-white py-4 rounded-lg font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose your luggage</h2>
            <p className="text-gray-600 mb-6">{days} day rental</p>

            {/* Early Bird / Rush indicator on step 2 */}
            {isEarlyBird && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-800 font-medium">🎉 Early Bird: 10% off your order!</span>
              </div>
            )}
            {isRushOrder && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="text-amber-800 font-medium">⚡ Rush Fee: +$9.99</span>
              </div>
            )}

            {availabilityLoading ? (
              <div className="text-center py-8">Checking availability...</div>
            ) : (
              <div className="space-y-4">
                {products.map(product => {
                  const available = availability[product.id] ?? 0
                  const inCart = cart[product.id] || 0
                  const soldOut = available === 0 && inCart === 0

                  // For sets, check if underlying products are available
                  let effectiveAvailable = available
                  if (product.slug === 'set') {
                    const carryonProduct = products.find(p => p.slug === 'carryon')
                    const largeProduct = products.find(p => p.slug === 'large')
                    if (carryonProduct && largeProduct) {
                      const carryonAvail = (availability[carryonProduct.id] ?? 0) - (cart[carryonProduct.id] || 0)
                      const largeAvail = (availability[largeProduct.id] ?? 0) - (cart[largeProduct.id] || 0)
                      effectiveAvailable = Math.min(available, carryonAvail, largeAvail)
                    }
                  }

                  const cantAddMore = inCart >= effectiveAvailable

                  return (
                    <div key={product.id} className={`flex items-center gap-4 p-4 border rounded-lg ${soldOut ? 'opacity-50' : ''}`}>
                      {product.image_url && (
                        <button
                          onClick={() => setGalleryProduct(product)}
                          className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition"
                        >
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-contain p-1"
                          />
                          {product.slug !== 'set' && (
                            <span className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded">
                              +3
                            </span>
                          )}
                        </button>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{product.description}</p>
                        <p className="text-sm font-medium mt-1">${(product.daily_rate / 100).toFixed(2)}/day</p>
                        <p className={`text-xs mt-1 ${soldOut ? 'text-red-600' : effectiveAvailable <= 3 ? 'text-orange-600' : 'text-gray-400'}`}>
                          {soldOut ? 'Sold out for these dates' : `${effectiveAvailable} available`}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateCart(product.id, -1)}
                          disabled={inCart === 0}
                          className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-6 text-center">{inCart}</span>
                        <button 
                          onClick={() => updateCart(product.id, 1)}
                          disabled={soldOut || cantAddMore}
                          className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {rentalSubtotal > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal</span>
                  <span>${(rentalSubtotal / 100).toFixed(2)}</span>
                </div>
                {isEarlyBird && (
                  <div className="flex justify-between text-green-600 text-sm mt-1">
                    <span>Early Bird Discount (10%)</span>
                    <span>-${(earlyBirdDiscount / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 border rounded-lg font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={rentalSubtotal === 0}
                className="flex-1 bg-black text-white py-4 rounded-lg font-medium disabled:bg-gray-300"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your details</h2>
            
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="w-full p-3 border rounded-lg" 
                    placeholder="John Smith" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input 
                    type="email" 
                    value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    className="w-full p-3 border rounded-lg" 
                    placeholder="john@example.com" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input 
                    type="tel" 
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full p-3 border rounded-lg" 
                    placeholder="(555) 123-4567" 
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Delivery Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input 
                      type="text" 
                      value={deliveryStreet}
                      onChange={e => setDeliveryStreet(e.target.value)}
                      className="w-full p-3 border rounded-lg" 
                      placeholder="123 Main St, Apt 4" 
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input 
                        type="text" 
                        value={deliveryCityAddress}
                        onChange={e => setDeliveryCityAddress(e.target.value)}
                        className="w-full p-3 border rounded-lg" 
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-2">State</label>
                      <select
                        value={deliveryState}
                        onChange={e => setDeliveryState(e.target.value)}
                        className="w-full p-3 border rounded-lg h-[50px]"
                      >
                        <option value=""></option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>{state.code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">ZIP</label>
                      <input 
                        type="text" 
                        value={deliveryZip}
                        onChange={e => setDeliveryZip(e.target.value)}
                        className="w-full p-3 border rounded-lg"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Delivery Window</label>
                    <select 
                      value={deliveryWindow}
                      onChange={e => setDeliveryWindow(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="morning">Morning (9am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - 8pm)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Return Address - only show for pickup, not ship-back */}
              {!isShipBack ? (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Return Address</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsDelivery}
                      onChange={e => setSameAsDelivery(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Same as delivery</span>
                  </label>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Street Address</label>
                    <input 
                      type="text" 
                      value={returnStreet}
                      onChange={e => {
                        setSameAsDelivery(false)
                        setReturnStreet(e.target.value)
                      }}
                      className="w-full p-3 border rounded-lg" 
                      placeholder="123 Main St, Apt 4" 
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-4">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium mb-2">City</label>
                      <input 
                        type="text" 
                        value={returnCityAddress}
                        onChange={e => {
                          setSameAsDelivery(false)
                          setReturnCityAddress(e.target.value)
                        }}
                        className="w-full p-3 border rounded-lg" 
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-sm font-medium mb-2">State</label>
                      <select
                        value={returnState}
                        onChange={e => {
                          setSameAsDelivery(false)
                          setReturnState(e.target.value)
                        }}
                        className="w-full p-3 border rounded-lg h-[50px]"
                      >
                        <option value=""></option>
                        {US_STATES.map(state => (
                          <option key={state.code} value={state.code}>{state.code}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">ZIP</label>
                      <input 
                        type="text" 
                        value={returnZip}
                        onChange={e => {
                          setSameAsDelivery(false)
                          setReturnZip(e.target.value)
                        }}
                        className="w-full p-3 border rounded-lg"
                        placeholder="90210"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Return Window</label>
                    <select 
                      value={returnWindow}
                      onChange={e => setReturnWindow(e.target.value)}
                      className="w-full p-3 border rounded-lg"
                    >
                      <option value="morning">Morning (9am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - 8pm)</option>
                    </select>
                  </div>
                </div>
              </div>
              ) : (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">📦 UPS Ship Back</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Ship from:</span> {shipBackStreet}, {shipBackCity}, {shipBackState} {shipBackZip}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Return by:</span> {returnDate}
                    </p>
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-sm text-blue-800">
                        ✓ Prepaid UPS label will be emailed after purchase<br />
                        ✓ Free UPS Poly Bag included with your delivery<br />
                        ✓ Drop off at any UPS location by return date
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Travel Pack Upsell */}
              {addons.filter(a => a.slug !== 'ups-poly-bag').length > 0 && (
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-4">Add to your trip</h3>
                  <div className="space-y-3">
                    {addons.filter(addon => addon.slug !== 'ups-poly-bag').map(addon => {
                      const inCart = addonCart[addon.id] || 0
                      const soldOut = addon.quantity_available === 0 && inCart === 0
                      const cantAddMore = inCart >= addon.quantity_available

                      return (
                        <div 
                          key={addon.id} 
                          className={`flex items-start gap-4 p-4 border rounded-lg bg-blue-50 border-blue-200 ${soldOut ? 'opacity-50' : ''}`}
                        >
                          {addon.image_url && (
                            <button
                              onClick={() => setGalleryAddon(addon)}
                              className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition cursor-pointer"
                            >
                              <img
                                src={addon.image_url}
                                alt={addon.name}
                                className="w-full h-full object-contain p-1"
                              />
                            </button>
                          )}
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{addon.name}</h4>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                            <p className="text-sm font-medium mt-1">${(addon.price / 100).toFixed(2)}</p>
                            {soldOut && (
                              <p className="text-xs text-red-600 mt-1">Out of stock</p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 pt-1">
                            <button 
                              onClick={() => updateAddonCart(addon.id, -1)}
                              disabled={inCart === 0}
                              className="w-8 h-8 rounded-full border border-blue-300 bg-white flex items-center justify-center disabled:opacity-30"
                            >
                              -
                            </button>
                            <span className="w-6 text-center">{inCart}</span>
                            <button 
                              onClick={() => updateAddonCart(addon.id, 1)}
                              disabled={soldOut || cantAddMore}
                              className="w-8 h-8 rounded-full border border-blue-300 bg-white flex items-center justify-center disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-4">Promo Code</h3>
                {appliedPromo ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <span className="font-medium text-green-800">{appliedPromo.code}</span>
                      <span className="text-green-600 ml-2">
                        {appliedPromo.discount_type === 'percent' 
                          ? `${appliedPromo.discount_value}% off`
                          : `$${(appliedPromo.discount_value / 100).toFixed(2)} off`
                        }
                      </span>
                    </div>
                    <button 
                      onClick={removePromoCode}
                      className="text-green-600 hover:text-green-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={promoCodeInput}
                      onChange={e => setPromoCodeInput(e.target.value.toUpperCase())}
                      className="flex-1 p-3 border rounded-lg"
                      placeholder="Enter code"
                    />
                    <button 
                      onClick={applyPromoCode}
                      disabled={promoLoading || !promoCodeInput.trim()}
                      className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {promoLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {promoError && (
                  <p className="text-red-500 text-sm mt-2">{promoError}</p>
                )}
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Rental Subtotal</span>
                <span>${(rentalSubtotal / 100).toFixed(2)}</span>
              </div>
              {addonsSubtotal > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Add-ons</span>
                  <span>${(addonsSubtotal / 100).toFixed(2)}</span>
                </div>
              )}
              {isShipBack && (
                <div className="flex justify-between mb-2">
                  <span>UPS Poly Bag (included)</span>
                  <span>$0.00</span>
                </div>
              )}
              {earlyBirdDiscount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Early Bird Discount (10%)</span>
                  <span>-${(earlyBirdDiscount / 100).toFixed(2)}</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Promo Code ({appliedPromo?.code})</span>
                  <span>-${(promoDiscount / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span>{isShipBack ? 'Delivery Fee' : 'Delivery & Pickup Fee'}</span>
                <span>${(deliveryFee / 100).toFixed(2)}</span>
              </div>
              {shipBackFee > 0 && (
                <div className="flex justify-between mb-2 text-blue-600">
                  <span>UPS Ship Back Fee</span>
                  <span>${(shipBackFee / 100).toFixed(2)}</span>
                </div>
              )}
              {rushFee > 0 && (
                <div className="flex justify-between mb-2 text-amber-600">
                  <span>Rush Fee</span>
                  <span>${(rushFee / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2">
                <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                <span>${(tax / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 border rounded-lg font-medium"
              >
                Back
              </button>
              <button
                onClick={handleCheckout}
                disabled={!isStep3Valid}
                className="flex-1 bg-black text-white py-4 rounded-lg font-medium disabled:bg-gray-300"
              >
                Continue to Payment
              </button>
            </div>
          </div>
        )}

        {step === 4 && clientSecret && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Payment</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm orderId={orderId} />
            </Elements>

            <button
              onClick={() => setStep(3)}
              className="w-full mt-4 py-4 border rounded-lg font-medium"
            >
              Back
            </button>
          </div>
        )}
      </div>

      {galleryProduct && (
        <ImageGallery 
          product={galleryProduct} 
          onClose={() => setGalleryProduct(null)} 
        />
      )}

      {galleryAddon && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="font-semibold text-lg">{galleryAddon.name}</h3>
              <button onClick={() => setGalleryAddon(null)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
            </div>
            
            <div className="p-4">
              {galleryAddon.image_url && (
                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                  <img
                    src={galleryAddon.image_url}
                    alt={galleryAddon.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              
              <p className="text-gray-600">{galleryAddon.description}</p>
              <p className="font-semibold mt-3">${(galleryAddon.price / 100).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}