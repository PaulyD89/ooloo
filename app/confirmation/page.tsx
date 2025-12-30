'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')
  const shortOrderId = orderId?.slice(0, 8).toUpperCase()

  return (
    <main className="min-h-screen bg-white">
      <header className="p-6 border-b">
        <a href="/">
          <img src="/oolooicon.png" alt="ooloo" className="h-12" />
        </a>
      </header>

      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
        <p className="text-gray-600 mb-2">
          Your luggage rental has been confirmed.
        </p>
        <p className="text-gray-600 mb-8">
          Order ID: <span className="font-mono font-medium">{shortOrderId}</span>
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left max-w-md mx-auto">
          <h3 className="font-semibold mb-3">What's next?</h3>
          <ul className="space-y-2 text-gray-600 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Confirmation email sent to your inbox
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              We'll text you when your driver is on the way
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              Enjoy your trip!
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href={`/order`}
            className="inline-block bg-black text-white px-8 py-4 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Manage Order
          </Link>
          <Link 
            href="/"
            className="inline-block border border-gray-300 px-8 py-4 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-8">
          Need to make changes? You can edit your address or cancel your order up to 48 hours before delivery.
        </p>
      </div>
    </main>
  )
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  )
}