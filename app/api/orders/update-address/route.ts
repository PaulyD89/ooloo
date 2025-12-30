import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Address change cutoff in hours before delivery/pickup
const ADDRESS_CHANGE_CUTOFF_HOURS = 24

export async function POST(request: NextRequest) {
  try {
    const { orderId, email, deliveryAddress, returnAddress } = await request.json()

    if (!orderId || !email) {
      return NextResponse.json({ error: 'Missing order ID or email' }, { status: 400 })
    }

    if (!deliveryAddress && !returnAddress) {
      return NextResponse.json({ error: 'No address changes provided' }, { status: 400 })
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

    // Check if cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json({ error: 'Cannot modify a cancelled order' }, { status: 400 })
    }

    // Check if already completed
    if (order.status === 'returned') {
      return NextResponse.json({ error: 'Cannot modify a completed order' }, { status: 400 })
    }

    const now = new Date()
    const updates: Record<string, string> = {}

    // Validate delivery address change
    if (deliveryAddress) {
      // Can't change if already delivered
      if (['delivered', 'out_for_pickup', 'returned'].includes(order.status)) {
        return NextResponse.json({ error: 'Delivery has already occurred' }, { status: 400 })
      }

      // Check cutoff for delivery address
      const deliveryDate = new Date(order.delivery_date + 'T00:00:00')
      const hoursUntilDelivery = (deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilDelivery < ADDRESS_CHANGE_CUTOFF_HOURS) {
        return NextResponse.json({ 
          error: `Delivery address can only be changed ${ADDRESS_CHANGE_CUTOFF_HOURS}+ hours before delivery. Please contact support.` 
        }, { status: 400 })
      }

      updates.delivery_address = deliveryAddress
    }

    // Validate return address change
    if (returnAddress) {
      // Check if this is a ship-back order
      if (order.return_method === 'ship') {
        return NextResponse.json({ 
          error: 'This is a UPS ship-back order. Return address cannot be changed.' 
        }, { status: 400 })
      }

      // Can't change if already picked up
      if (order.status === 'returned') {
        return NextResponse.json({ error: 'Return has already occurred' }, { status: 400 })
      }

      // Check cutoff for return address
      const returnDate = new Date(order.return_date + 'T00:00:00')
      const hoursUntilReturn = (returnDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      if (hoursUntilReturn < ADDRESS_CHANGE_CUTOFF_HOURS) {
        return NextResponse.json({ 
          error: `Return address can only be changed ${ADDRESS_CHANGE_CUTOFF_HOURS}+ hours before pickup. Please contact support.` 
        }, { status: 400 })
      }

      updates.return_address = returnAddress
    }

    // Apply updates
    const { error: updateError } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Address updated successfully',
      updates
    })

  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
  }
}