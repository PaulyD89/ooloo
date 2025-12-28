'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order')

  return (
    <main className="min-h-screen bg-white">
      <header className="p-6 border-b">
        <h1 className="text-2xl font-bold">ooloo</h1>
      </header>

      <div className="max-w-2xl mx-auto p-6 text-center py-20">
        <div className="text-5xl mb-6">✓</div>
        <h2 className="text-3xl font-bold mb-4">You're all set!</h2>
        <p className="text-gray-600 mb-2">
          Your luggage rental has been confirmed.
        </p>
        <p className="text-gray-600 mb-8">
          Order ID: <span className="font-mono">{orderId}</span>
        </p>
        <p className="text-gray-600 mb-8">
          We'll send a confirmation email with your delivery details. 
          You'll receive a text when your driver is on the way.
        </p>
        <Link 
          href="/"
          className="inline-block bg-black text-white px-8 py-4 rounded-lg font-medium"
        >
          Back to Home
        </Link>
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