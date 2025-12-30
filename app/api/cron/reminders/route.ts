import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDeliveryReminder, sendReturnReminder } from '../../../../lib/twilio'

// This endpoint should be called daily by Vercel Cron
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/reminders",
//     "schedule": "0 14 * * *"  // 2pm UTC = 6am PT / 9am ET
//   }]
// }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need service role for cron
)

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    deliveryReminders: { sent: 0, failed: 0 },
    returnReminders: { sent: 0, failed: 0 }
  }

  try {
    // Get tomorrow's date
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Format date for SMS
    const formattedDate = tomorrow.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })

    // Get delivery reminders (orders being delivered tomorrow)
    const { data: deliveryOrders, error: deliveryError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, delivery_window')
      .eq('delivery_date', tomorrowStr)
      .in('status', ['confirmed', 'pending'])

    if (deliveryError) {
      console.error('Error fetching delivery orders:', deliveryError)
    } else if (deliveryOrders) {
      for (const order of deliveryOrders) {
        if (!order.customer_phone) continue
        
        const window = formatWindow(order.delivery_window)
        const result = await sendDeliveryReminder(
          order.customer_phone,
          order.customer_name.split(' ')[0], // First name only
          window,
          formattedDate
        )
        
        if (result.success) {
          results.deliveryReminders.sent++
        } else {
          results.deliveryReminders.failed++
          console.error(`Failed to send delivery reminder for order ${order.id}:`, result.error)
        }
      }
    }

    // Get return reminders (orders being picked up tomorrow, excluding ship-back)
    const { data: returnOrders, error: returnError } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, return_window, return_method')
      .eq('return_date', tomorrowStr)
      .eq('status', 'delivered')
      .or('return_method.is.null,return_method.eq.pickup') // Exclude ship-back

    if (returnError) {
      console.error('Error fetching return orders:', returnError)
    } else if (returnOrders) {
      for (const order of returnOrders) {
        if (!order.customer_phone || order.return_method === 'ship') continue
        
        const window = formatWindow(order.return_window)
        const result = await sendReturnReminder(
          order.customer_phone,
          order.customer_name.split(' ')[0],
          window,
          formattedDate
        )
        
        if (result.success) {
          results.returnReminders.sent++
        } else {
          results.returnReminders.failed++
          console.error(`Failed to send return reminder for order ${order.id}:`, result.error)
        }
      }
    }

    console.log('Reminder cron completed:', results)
    return NextResponse.json({ success: true, results })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

function formatWindow(window: string | null): string {
  if (!window) return '9am - 12pm'
  const windows: Record<string, string> = {
    morning: '9am - 12pm',
    afternoon: '12pm - 5pm',
    evening: '5pm - 8pm'
  }
  return windows[window] || window
}