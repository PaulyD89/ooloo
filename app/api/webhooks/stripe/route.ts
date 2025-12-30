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
      
      // Get the order with all details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_city:cities!delivery_city_id(name),
          return_city:cities!return_city_id(name)
        `)
        .eq('stripe_payment_intent_id', paymentIntent.id)
        .single()

      if (orderError || !order) {
        console.error('Order not found:', orderError)
        break
      }

      // Update order status to confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order.id)

      // Get order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products!product_id(name)
        `)
        .eq('order_id', order.id)

      const items = orderItems?.map(item => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        lineTotal: item.line_total
      })) || []

      // Check if this is a ship-back order
      const isShipBack = order.return_method === 'ship'

      // Send confirmation email
      try {
        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://ooloo.vercel.app'}/api/send-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: order.customer_email,
            customerName: order.customer_name,
            orderId: order.id,
            deliveryDate: order.delivery_date,
            returnDate: order.return_date,
            deliveryAddress: order.delivery_address,
            returnAddress: order.return_address,
            deliveryWindow: order.delivery_window,
            returnWindow: order.return_window,
            items,
            subtotal: order.subtotal,
            discount: order.discount || 0,
            deliveryFee: order.delivery_fee || 1999,
            tax: order.tax,
            total: order.total,
            // Ship back fields
            isShipBack,
            shipBackAddress: order.ship_back_address,
            shipBackCity: order.ship_back_city,
            shipBackState: order.ship_back_state,
            shipBackZip: order.ship_back_zip,
            shipBackFee: order.ship_back_fee
          })
        })
        console.log('Confirmation email sent for order:', order.id)
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError)
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