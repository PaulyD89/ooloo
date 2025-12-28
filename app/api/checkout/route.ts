import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
      subtotal,
      discount,
      deliveryFee,
      tax,
      total,
      promoCodeId
    } = body

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      metadata: {
        customerEmail,
        customerName,
      }
    })

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
        discount: discount || 0,
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

    // Create order items
    const orderItems = Object.entries(cart).map(([productId, details]: [string, any]) => ({
      order_id: order.id,
      product_id: productId,
      quantity: details.quantity,
      daily_rate: details.dailyRate,
      days: details.days,
      line_total: details.quantity * details.dailyRate * details.days
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Order items error:', itemsError)
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