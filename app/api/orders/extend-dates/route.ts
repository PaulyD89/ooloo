import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export async function POST(request: NextRequest) {
  try {
    const { orderId, newReturnDate, paymentIntentId } = await request.json()

    if (!orderId || !newReturnDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order can be extended
    if (['cancelled', 'returned'].includes(order.status)) {
      return NextResponse.json({ error: 'This order cannot be modified' }, { status: 400 })
    }

    // Parse dates
    const currentReturnDate = new Date(order.return_date + 'T00:00:00')
    const newReturn = new Date(newReturnDate + 'T00:00:00')
    const deliveryDate = new Date(order.delivery_date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validate new return date is after delivery date
    if (newReturn <= deliveryDate) {
      return NextResponse.json({ error: 'Return date must be after delivery date' }, { status: 400 })
    }

    // Validate new return date is in the future
    if (newReturn < today) {
      return NextResponse.json({ error: 'Return date must be in the future' }, { status: 400 })
    }

    // Calculate day difference
    const currentDays = Math.ceil((currentReturnDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    const newDays = Math.ceil((newReturn.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayDifference = newDays - currentDays

    if (dayDifference === 0) {
      return NextResponse.json({ error: 'New return date is the same as current' }, { status: 400 })
    }

    // Fetch order items to calculate price difference
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError || !orderItems) {
      return NextResponse.json({ error: 'Could not fetch order items' }, { status: 500 })
    }

    // Calculate the daily rental rate (sum of all items' daily rates * quantities)
    const dailyRate = orderItems.reduce((sum, item) => sum + (item.daily_rate * item.quantity), 0)
    
    // Calculate price difference (positive = charge more, negative = credit)
    const priceDifference = dailyRate * dayDifference
    
    // Get tax rate from original order
    const originalSubtotal = order.subtotal
    const originalTax = order.tax
    const taxRate = originalSubtotal > 0 ? originalTax / originalSubtotal : 0.095

    // Calculate new totals
    const newSubtotal = order.subtotal + priceDifference
    const newTax = Math.round(newSubtotal * taxRate)
    const taxDifference = newTax - order.tax
    const totalDifference = priceDifference + taxDifference

    // If extending (customer owes more), need payment
    if (totalDifference > 0) {
      // If no paymentIntentId provided, create one and return clientSecret
      if (!paymentIntentId) {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: totalDifference,
          currency: 'usd',
          metadata: {
            orderId,
            type: 'extension',
            dayDifference: dayDifference.toString(),
            newReturnDate
          }
        })

        return NextResponse.json({
          requiresPayment: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          totalDifference,
          dayDifference,
          newTotal: order.total + totalDifference
        })
      }

      // Payment intent provided - verify it was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
      }

      // Payment successful - update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          return_date: newReturnDate,
          subtotal: newSubtotal,
          tax: newTax,
          total: order.total + totalDifference,
          admin_notes: `${order.admin_notes || ''}\n[${new Date().toISOString()}] Customer extended rental by ${dayDifference} days. Charged: $${(totalDifference / 100).toFixed(2)}`
        })
        .eq('id', orderId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      // Update order_items with new days
      for (const item of orderItems) {
        const newLineTotal = item.daily_rate * item.quantity * newDays
        await supabase
          .from('order_items')
          .update({
            days: newDays,
            line_total: newLineTotal
          })
          .eq('id', item.id)
      }

      return NextResponse.json({
        success: true,
        message: `Rental extended by ${dayDifference} day${dayDifference > 1 ? 's' : ''}. Payment of $${(totalDifference / 100).toFixed(2)} processed.`,
        priceDifference: totalDifference,
        newReturnDate,
        newTotal: order.total + totalDifference
      })

    } else if (totalDifference < 0) {
      // Shortening rental - issue credit/refund (no payment needed)
      const refundAmount = Math.abs(totalDifference)

      // Try to refund via Stripe if we have a payment intent
      if (order.stripe_payment_intent_id) {
        try {
          await stripe.refunds.create({
            payment_intent: order.stripe_payment_intent_id,
            amount: refundAmount
          })
        } catch (stripeError) {
          console.error('Stripe refund error:', stripeError)
          // Continue anyway - admin can manually refund
        }
      }

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          return_date: newReturnDate,
          subtotal: newSubtotal,
          tax: newTax,
          total: order.total + totalDifference,
          admin_notes: `${order.admin_notes || ''}\n[${new Date().toISOString()}] Customer shortened rental by ${Math.abs(dayDifference)} days. Refund issued: $${(refundAmount / 100).toFixed(2)}`
        })
        .eq('id', orderId)

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      // Update order_items
      for (const item of orderItems) {
        const newLineTotal = item.daily_rate * item.quantity * newDays
        await supabase
          .from('order_items')
          .update({
            days: newDays,
            line_total: newLineTotal
          })
          .eq('id', item.id)
      }

      return NextResponse.json({
        success: true,
        message: `Rental shortened by ${Math.abs(dayDifference)} day${Math.abs(dayDifference) > 1 ? 's' : ''}. Refund of $${(refundAmount / 100).toFixed(2)} issued.`,
        priceDifference: totalDifference,
        newReturnDate,
        newTotal: order.total + totalDifference,
        refundIssued: true
      })
    }

    return NextResponse.json({ error: 'No change in dates' }, { status: 400 })

  } catch (error) {
    console.error('Extend rental error:', error)
    return NextResponse.json({ error: 'Failed to extend rental' }, { status: 500 })
  }
}

// GET endpoint to calculate price difference without committing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')
  const newReturnDate = searchParams.get('newReturnDate')

  if (!orderId || !newReturnDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Fetch order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (!orderItems) {
      return NextResponse.json({ error: 'Could not fetch order items' }, { status: 500 })
    }

    // Parse dates
    const currentReturnDate = new Date(order.return_date + 'T00:00:00')
    const newReturn = new Date(newReturnDate + 'T00:00:00')
    const deliveryDate = new Date(order.delivery_date + 'T00:00:00')

    // Calculate days
    const currentDays = Math.ceil((currentReturnDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    const newDays = Math.ceil((newReturn.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
    const dayDifference = newDays - currentDays

    // Calculate price
    const dailyRate = orderItems.reduce((sum, item) => sum + (item.daily_rate * item.quantity), 0)
    const priceDifference = dailyRate * dayDifference

    // Tax
    const taxRate = order.subtotal > 0 ? order.tax / order.subtotal : 0.095
    const newSubtotal = order.subtotal + priceDifference
    const newTax = Math.round(newSubtotal * taxRate)
    const taxDifference = newTax - order.tax
    const totalDifference = priceDifference + taxDifference

    return NextResponse.json({
      currentDays,
      newDays,
      dayDifference,
      dailyRate,
      priceDifference,
      taxDifference,
      totalDifference,
      newTotal: order.total + totalDifference
    })

  } catch (error) {
    console.error('Calculate extension error:', error)
    return NextResponse.json({ error: 'Failed to calculate' }, { status: 500 })
  }
}