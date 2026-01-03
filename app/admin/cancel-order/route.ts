import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId, reason, issueRefund } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Missing order ID' }, { status: 400 })
    }

    // Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if already cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 })
    }

    let refundStatus = 'not_requested'

    // Process refund via Stripe if requested
    if (issueRefund && order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
        
        if (paymentIntent.status === 'succeeded') {
          await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            reason: 'requested_by_customer'
          })
          refundStatus = 'refunded'
        } else {
          refundStatus = 'payment_not_captured'
        }
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        refundStatus = 'refund_failed: ' + stripeError.message
      }
    } else if (issueRefund && !order.stripe_payment_intent_id) {
      refundStatus = 'no_payment_intent_found'
    }

    // Update order status and add admin note
    const adminNote = order.admin_notes 
      ? `${order.admin_notes}\n\n[CANCELLED by Admin] ${new Date().toISOString()}\nReason: ${reason || 'No reason provided'}\nRefund: ${refundStatus}`
      : `[CANCELLED by Admin] ${new Date().toISOString()}\nReason: ${reason || 'No reason provided'}\nRefund: ${refundStatus}`

    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled',
        admin_notes: adminNote
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
    }

    // Release inventory reservations
    await supabase
      .from('reservations')
      .delete()
      .eq('order_id', orderId)

    // Restore referral credit if it was used
    if (order.referral_credit_applied && order.referral_credit_applied > 0) {
      const { data: customer } = await supabase
        .from('customers')
        .select('id, referral_credit')
        .eq('email', order.customer_email.toLowerCase())
        .single()

      if (customer) {
        await supabase
          .from('customers')
          .update({ 
            referral_credit: customer.referral_credit + order.referral_credit_applied 
          })
          .eq('id', customer.id)
      }
    }

    return NextResponse.json({ 
      success: true, 
      refundStatus,
      message: refundStatus === 'refunded' 
        ? 'Order cancelled and refund processed' 
        : `Order cancelled. Refund status: ${refundStatus}`
    })

  } catch (error) {
    console.error('Admin cancel order error:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}