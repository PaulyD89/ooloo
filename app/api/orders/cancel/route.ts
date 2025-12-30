import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Cancellation cutoff in hours before delivery
const CANCELLATION_CUTOFF_HOURS = 48

export async function POST(request: NextRequest) {
  try {
    const { orderId, email } = await request.json()

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing order ID or email' }, { status: 400 })
    }

    // Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('customer_email', email.toLowerCase())
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if already cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 })
    }

    // Check if already delivered
    if (['delivered', 'out_for_pickup', 'returned'].includes(order.status)) {
      return NextResponse.json({ error: 'Cannot cancel an order that has already been delivered' }, { status: 400 })
    }

    // Check cancellation cutoff (48 hours before delivery)
    const deliveryDate = new Date(order.delivery_date + 'T00:00:00')
    const now = new Date()
    const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilDelivery < CANCELLATION_CUTOFF_HOURS) {
      return NextResponse.json({ 
        error: `Orders can only be cancelled ${CANCELLATION_CUTOFF_HOURS}+ hours before delivery. Please contact support.` 
      }, { status: 400 })
    }

    // Process refund via Stripe
    if (order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
        
        if (paymentIntent.status === 'succeeded') {
          await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            reason: 'requested_by_customer'
          })
        }
      } catch (stripeError) {
        console.error('Stripe refund error:', stripeError)
        // Continue with cancellation even if refund fails - can be handled manually
      }
    }

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
    }

    // Release inventory reservations
    const { error: reservationError } = await supabase
      .from('reservations')
      .delete()
      .eq('order_id', orderId)

    if (reservationError) {
      console.error('Reservation release error:', reservationError)
      // Non-fatal, continue
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Order cancelled and refund initiated' 
    })

  } catch (error) {
    console.error('Cancel order error:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}