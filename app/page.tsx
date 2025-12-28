import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="p-6">
        <a href="/">
          <img 
            src="/oolooicon.jpg" 
            alt="ooloo" 
            className="h-16"
          />
        </a>
      </header>

      {/* Hero */}
      <section className="px-6 py-16 max-w-2xl mx-auto text-center">
        <img 
          src="/oolooaltlogowithtag.png" 
          alt="ooloo - Rent the luggage. Own the trip." 
          className="h-48 mx-auto mb-10"
        />
        <h2 className="text-4xl font-bold mb-6">
          Rent luggage for your next trip
        </h2>
        <p className="text-xl text-gray-600 mb-10">
          Premium luggage delivered to your door. Return it when you're back.
          No storage, no hassle.
        </p>
        <Link
          href="/book"
          className="inline-block bg-black text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-800 transition"
        >
          Book Now
        </Link>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-16">How it works</h3>
          
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  1
                </div>
                <h4 className="font-bold text-xl mb-3">Choose your dates</h4>
                <p className="text-gray-600">Select when you need the luggage delivered and picked up. We're flexible with your schedule.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  2
                </div>
                <h4 className="font-bold text-xl mb-3">Pick your bags</h4>
                <p className="text-gray-600">Choose from carry-ons to large check-ins. All our luggage is premium quality and freshly cleaned.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                  3
                </div>
                <h4 className="font-bold text-xl mb-3">We deliver & pick up</h4>
                <p className="text-gray-600">Luggage arrives at your door. When your trip is over, we pick it up the same way. Easy!</p>
              </div>
            </div>
          </div>

          {/* Connecting line (visible on desktop) */}
          <div className="hidden md:block relative -mt-48 mb-32 mx-auto" style={{ width: '70%', zIndex: -1 }}>
            <div className="border-t-2 border-dashed border-gray-200"></div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-cyan-500 to-cyan-600">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">Ready to travel lighter?</h3>
          <p className="text-cyan-100 text-lg mb-8">
            Book your luggage rental in minutes. Free cancellation up to 48 hours before delivery.
          </p>
          <Link
            href="/book"
            className="inline-block bg-white text-cyan-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 transition shadow-lg"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/oolooicon.jpg" alt="ooloo" className="h-10 rounded" />
            <span className="text-white font-medium">ooloo</span>
          </div>
          <p className="text-sm">© 2024 ooloo. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}