import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

  const results = {
    emailsSent: 0,
    emailsFailed: 0,
    ordersDeleted: 0,
    errors: [] as string[]
  }

  try {
    // 1. ABANDONED CART EMAILS
    // Find pending orders between 1-2 hours old that haven't been emailed yet
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000)
    
    const { data: abandonedOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .is('abandoned_email_sent', null)
      .lt('created_at', oneHourAgo.toISOString())
      .gt('created_at', twoHoursAgo.toISOString())

    if (fetchError) {
      results.errors.push(`Fetch abandoned orders error: ${fetchError.message}`)
    }

    if (abandonedOrders && abandonedOrders.length > 0) {
      for (const order of abandonedOrders) {
        try {
          // Generate a unique recovery code for 10% off
          const recoveryCode = `COMEBACK10-${order.id.slice(0, 8).toUpperCase()}`
          
          // Store the promo code in the database
          await supabase
            .from('promo_codes')
            .upsert({
              code: recoveryCode,
              discount_type: 'percent',
              discount_value: 10,
              usage_limit: 1,
              times_used: 0,
              expires_at: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
              is_active: true
            }, { onConflict: 'code' })

          // Send recovery email
          const firstName = order.customer_name?.split(' ')[0] || 'there'
          
          await resend.emails.send({
            from: 'ooloo <hello@ooloo.co>',
            to: order.customer_email,
            subject: 'You left something behind! Here\'s 10% off 🧳',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="https://ooloo.co/oolooicon.png" alt="ooloo" style="height: 50px;">
                </div>
                
                <h1 style="font-size: 24px; margin-bottom: 20px;">Hey ${firstName}! 👋</h1>
                
                <p>We noticed you didn't finish your luggage rental booking. No worries – your trip plans are still waiting for you!</p>
                
                <p>To make it easier, here's <strong>10% off</strong> your order:</p>
                
                <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0;">
                  <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.9;">YOUR PROMO CODE</p>
                  <p style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${recoveryCode}</p>
                  <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">Expires in 7 days</p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://ooloo.co/book" style="display: inline-block; background: #111; color: white; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 500;">Complete Your Booking</a>
                </div>
                
                <p style="color: #666; font-size: 14px;">Premium luggage, delivered to your door, picked up when you're back. Travel lighter!</p>
                
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                
                <p style="color: #999; font-size: 12px; text-align: center;">
                  Questions? Just reply to this email.<br>
                  <a href="https://ooloo.co" style="color: #0891b2;">ooloo.co</a>
                </p>
              </body>
              </html>
            `
          })

          // Mark as emailed
          await supabase
            .from('orders')
            .update({ abandoned_email_sent: now.toISOString() })
            .eq('id', order.id)

          results.emailsSent++
        } catch (emailError: any) {
          results.emailsFailed++
          results.errors.push(`Email error for ${order.id}: ${emailError.message}`)
        }
      }
    }

    // 2. DELETE OLD PENDING ORDERS (older than 48 hours)
    const { data: oldPendingOrders, error: deleteError } = await supabase
      .from('orders')
      .delete()
      .eq('status', 'pending')
      .lt('created_at', fortyEightHoursAgo.toISOString())
      .select()

    if (deleteError) {
      results.errors.push(`Delete error: ${deleteError.message}`)
    } else {
      results.ordersDeleted = oldPendingOrders?.length || 0
    }

    // Also clean up any reservations for deleted orders
    // (These should cascade delete if FK is set up, but just in case)

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      ...results
    }, { status: 500 })
  }
}