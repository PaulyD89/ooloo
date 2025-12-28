import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Update order status to confirmed
      const { error } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .eq('status', 'pending')

      if (error) {
        console.error('Error updating order:', error)
      } else {
        console.log('Order confirmed for payment:', paymentIntent.id)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      
      // Get the order
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (order) {
        // Cancel the order
        await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id)

        // Release the inventory reservations
        await supabase
          .from('reservations')
          .delete()
          .eq('order_id', order.id)

        console.log('Order cancelled and inventory released for payment:', paymentIntent.id)
      }
      break
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      
      // Update order status to refunded
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('stripe_payment_intent_id', charge.payment_intent)

      if (error) {
        console.error('Error updating refunded order:', error)
      } else {
        console.log('Order marked as cancelled (refunded) for charge:', charge.id)
      }
      break
    }

    case 'charge.dispute.created': {
      const dispute = event.data.object as Stripe.Dispute
      console.log('⚠️ DISPUTE CREATED:', dispute.id, 'Amount:', dispute.amount)
      // You could send yourself an email/SMS alert here
      break
    }

    default:
      console.log('Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}