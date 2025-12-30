import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

// Initialize client (lazy - only when needed)
let client: twilio.Twilio | null = null

function getClient() {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured')
    }
    client = twilio(accountSid, authToken)
  }
  return client
}

// Format phone number to E.164 format
function formatPhone(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')
  
  // If it's 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`
  }
  
  // If it's 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`
  }
  
  // Otherwise return as-is with +
  return digits.startsWith('+') ? digits : `+${digits}`
}

export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    if (!fromNumber) {
      throw new Error('Twilio phone number not configured')
    }

    const client = getClient()
    const formattedTo = formatPhone(to)
    
    const result = await client.messages.create({
      body: message,
      from: fromNumber,
      to: formattedTo
    })

    console.log('SMS sent:', result.sid, 'to:', formattedTo)
    return { success: true, messageId: result.sid }
  } catch (error: any) {
    console.error('SMS error:', error.message)
    return { success: false, error: error.message }
  }
}

// Pre-built message templates
export const smsTemplates = {
  deliveryReminder: (name: string, window: string, date: string) => 
    `Hi ${name}! Your ooloo luggage arrives tomorrow (${date}) between ${window}. Please ensure someone is available to receive it. Questions? Reply to this text!`,
  
  returnReminder: (name: string, window: string, date: string) =>
    `Hi ${name}! We're picking up your ooloo luggage tomorrow (${date}) between ${window}. Please have all bags ready by the door. Questions? Reply to this text!`,
  
  outForDelivery: (name: string) =>
    `Your ooloo luggage is out for delivery! Our driver will arrive within the next couple hours.`,
  
  delivered: (name: string) =>
    `Your ooloo luggage has been delivered! Have a great trip! 🧳`,

  orderConfirmed: (name: string, deliveryDate: string) =>
    `Thanks for your ooloo order, ${name}! Your luggage will arrive on ${deliveryDate}. We'll text you the day before with a reminder.`,
  
  cancelled: (name: string) =>
    `Hi ${name}, your ooloo order has been cancelled and your refund is being processed. You'll see it in 5-10 business days.`
}

// Convenience functions
export async function sendDeliveryReminder(phone: string, name: string, window: string, date: string) {
  return sendSMS(phone, smsTemplates.deliveryReminder(name, window, date))
}

export async function sendReturnReminder(phone: string, name: string, window: string, date: string) {
  return sendSMS(phone, smsTemplates.returnReminder(name, window, date))
}

export async function sendOutForDelivery(phone: string, name: string) {
  return sendSMS(phone, smsTemplates.outForDelivery(name))
}

export async function sendDeliveredNotification(phone: string, name: string) {
  return sendSMS(phone, smsTemplates.delivered(name))
}

export async function sendOrderConfirmed(phone: string, name: string, deliveryDate: string) {
  return sendSMS(phone, smsTemplates.orderConfirmed(name, deliveryDate))
}

export async function sendCancellationNotification(phone: string, name: string) {
  return sendSMS(phone, smsTemplates.cancelled(name))
}