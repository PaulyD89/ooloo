import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Pricing constants - keep in sync with frontend
const EARLY_BIRD_DAYS = 60
const EARLY_BIRD_DISCOUNT_PERCENT = 10
const RUSH_FEE = 999 // $9.99 in cents

type AddonCartItem = { quantity: number; price: number }
type CartItem = { quantity: number; dailyRate?: number; days?: number }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerEmail,
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryCityId,
      returnAddress,
      returnCityId,
      deliveryDate,
      returnDate,
      deliveryWindow,
      returnWindow,
      cart,
      addons: addonCart,
      rentalSubtotal,
      addonsSubtotal,
      subtotal,
      earlyBirdDiscount,
      promoDiscount,
      rushFee,
      deliveryFee,
      tax,
      total,
      promoCodeId
    } = body

    // Server-side validation of Early Bird and Rush Fee
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const delivery = new Date(deliveryDate)
    delivery.setHours(0, 0, 0, 0)
    const diffTime = delivery.getTime() - today.getTime()
    const daysUntilDelivery = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const isEarlyBird = daysUntilDelivery >= EARLY_BIRD_DAYS
    const isRushOrder = daysUntilDelivery <= 1

    // Validate Early Bird discount (only applies to rental, not addons)
    const expectedEarlyBirdDiscount = isEarlyBird 
      ? Math.round(rentalSubtotal * (EARLY_BIRD_DISCOUNT_PERCENT / 100)) 
      : 0
    
    if (earlyBirdDiscount !== expectedEarlyBirdDiscount) {
      return NextResponse.json({ 
        error: 'Invalid Early Bird discount. Please refresh and try again.' 
      }, { status: 400 })
    }

    // Validate Rush Fee
    const expectedRushFee = isRushOrder ? RUSH_FEE : 0
    if (rushFee !== expectedRushFee) {
      return NextResponse.json({ 
        error: 'Invalid Rush Fee. Please refresh and try again.' 
      }, { status: 400 })
    }

    // Get product info for set handling
    const { data: products } = await supabase
      .from('products')
      .select('id, slug')

    const productMap = new Map(products?.map(p => [p.id, p.slug]) || [])
    const carryonProductId = products?.find(p => p.slug === 'carryon')?.id
    const largeProductId = products?.find(p => p.slug === 'large')?.id

    // Verify rental availability before proceeding
    const cartEntries = Object.entries(cart) as [string, CartItem][]
    for (const [productId, details] of cartEntries) {
      const slug = productMap.get(productId)
      let itemsToCheck: { productId: string; quantity: number }[] = []

      if (slug === 'set') {
        itemsToCheck = [
          { productId: carryonProductId!, quantity: details.quantity },
          { productId: largeProductId!, quantity: details.quantity }
        ]
      } else {
        itemsToCheck = [{ productId, quantity: details.quantity }]
      }

      for (const item of itemsToCheck) {
        // Get reserved items for date range
        const { data: reservedItemIds } = await supabase
          .from('reservations')
          .select('inventory_item_id')
          .gte('end_date', deliveryDate)
          .lte('start_date', returnDate)

        const excludeIds = reservedItemIds?.map(r => r.inventory_item_id) || []

        let query = supabase
          .from('inventory_items')
          .select('id', { count: 'exact', head: true })
          .eq('city_id', deliveryCityId)
          .eq('product_id', item.productId)
          .eq('status', 'available')

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { count } = await query

        if ((count || 0) < item.quantity) {
          return NextResponse.json({ 
            error: 'Some items are no longer available. Please go back and adjust your order.' 
          }, { status: 400 })
        }
      }
    }

    // Verify addon availability
    const addonCartRecord = addonCart as Record<string, AddonCartItem> | undefined
    if (addonCartRecord && Object.keys(addonCartRecord).length > 0) {
      for (const addonId of Object.keys(addonCartRecord)) {
        const details = addonCartRecord[addonId]
        const { data: addon } = await supabase
          .from('addons')
          .select('quantity_available, price')
          .eq('id', addonId)
          .eq('is_active', true)
          .single()

        if (!addon) {
          return NextResponse.json({ 
            error: 'Add-on not found. Please refresh and try again.' 
          }, { status: 400 })
        }

        if (addon.quantity_available < details.quantity) {
          return NextResponse.json({ 
            error: 'Some add-ons are no longer available in the requested quantity.' 
          }, { status: 400 })
        }

        // Verify price hasn't changed
        if (addon.price !== details.price) {
          return NextResponse.json({ 
            error: 'Add-on price has changed. Please refresh and try again.' 
          }, { status: 400 })
        }
      }
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      metadata: {
        customerEmail,
        customerName,
      }
    })

    // Calculate total discount for storage (Early Bird + Promo)
    const totalDiscount = (earlyBirdDiscount || 0) + (promoDiscount || 0)

    // Create the order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        delivery_city_id: deliveryCityId,
        return_address: returnAddress,
        return_city_id: returnCityId,
        delivery_date: deliveryDate,
        return_date: returnDate,
        delivery_window: deliveryWindow,
        return_window: returnWindow,
        subtotal,
        discount: totalDiscount,
        early_bird_discount: earlyBirdDiscount || 0,
        promo_discount: promoDiscount || 0,
        rush_fee: rushFee || 0,
        delivery_fee: deliveryFee || 1999,
        promo_code_id: promoCodeId || null,
        tax,
        total,
        stripe_payment_intent_id: paymentIntent.id,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items (rentals)
    const orderItems = cartEntries.map(([productId, details]) => ({
      order_id: order.id,
      product_id: productId,
      quantity: details.quantity,
      daily_rate: details.dailyRate,
      days: details.days,
      line_total: details.quantity * (details.dailyRate || 0) * (details.days || 0)
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
    }

    // Create order addons and decrement inventory
    if (addonCartRecord && Object.keys(addonCartRecord).length > 0) {
      const orderAddons = Object.keys(addonCartRecord).map(addonId => {
        const details = addonCartRecord[addonId]
        return {
          order_id: order.id,
          addon_id: addonId,
          quantity: details.quantity,
          unit_price: details.price
        }
      })

      const { error: addonsError } = await supabase
        .from('order_addons')
        .insert(orderAddons)

      if (addonsError) {
        console.error('Order addons error:', addonsError)
      }

      // Decrement addon inventory
      for (const addonId of Object.keys(addonCartRecord)) {
        const details = addonCartRecord[addonId]
        // Fetch current quantity and update
        const { data: currentAddon } = await supabase
          .from('addons')
          .select('quantity_available')
          .eq('id', addonId)
          .single()

        if (currentAddon) {
          await supabase
            .from('addons')
            .update({ quantity_available: currentAddon.quantity_available - details.quantity })
            .eq('id', addonId)
        }
      }
    }

    // Reserve inventory (rentals)
    const reservations: { inventory_item_id: string; order_id: string; start_date: string; end_date: string }[] = []

    for (const [productId, details] of cartEntries) {
      const slug = productMap.get(productId)
      let itemsToReserve: { productId: string; quantity: number }[] = []

      if (slug === 'set') {
        itemsToReserve = [
          { productId: carryonProductId!, quantity: details.quantity },
          { productId: largeProductId!, quantity: details.quantity }
        ]
      } else {
        itemsToReserve = [{ productId, quantity: details.quantity }]
      }

      for (const item of itemsToReserve) {
        const { data: reservedItemIds } = await supabase
          .from('reservations')
          .select('inventory_item_id')
          .gte('end_date', deliveryDate)
          .lte('start_date', returnDate)

        const excludeIds = reservedItemIds?.map(r => r.inventory_item_id) || []

        let query = supabase
          .from('inventory_items')
          .select('id')
          .eq('city_id', deliveryCityId)
          .eq('product_id', item.productId)
          .eq('status', 'available')
          .limit(item.quantity)

        if (excludeIds.length > 0) {
          query = query.not('id', 'in', `(${excludeIds.join(',')})`)
        }

        const { data: availableItems } = await query

        if (availableItems) {
          for (const invItem of availableItems) {
            reservations.push({
              inventory_item_id: invItem.id,
              order_id: order.id,
              start_date: deliveryDate,
              end_date: returnDate
            })
          }
        }
      }
    }

    if (reservations.length > 0) {
      const { error: reserveError } = await supabase
        .from('reservations')
        .insert(reservations)

      if (reserveError) {
        console.error('Reservation error:', reserveError)
      }
    }

    // Increment promo code usage if one was used
    if (promoCodeId) {
      await supabase.rpc('increment_promo_usage', { promo_id: promoCodeId })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id
    })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}