import { NextRequest, NextResponse } from 'next/server'
import { sendSMS } from '../../../../lib/twilio'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()

    if (!phone || !name) {
      return NextResponse.json({ error: 'Missing phone or name' }, { status: 400 })
    }

    // Send a thank you message when luggage is picked up
    const message = `Thanks for renting with ooloo, ${name}! We hope you had a great trip. 🧳 See you next time!`
    const result = await sendSMS(phone, message)

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }
  } catch (error) {
    console.error('Picked up SMS error:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}