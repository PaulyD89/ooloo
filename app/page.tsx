import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="p-6">
        <h1 className="text-2xl font-bold">ooloo</h1>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-2xl mx-auto text-center">
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
      <section className="px-6 py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-12">How it works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-4">1</div>
              <h4 className="font-semibold mb-2">Choose your dates</h4>
              <p className="text-gray-600">Select when you need the luggage delivered and picked up.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">2</div>
              <h4 className="font-semibold mb-2">Pick your bags</h4>
              <p className="text-gray-600">Choose from carry-ons to large check-ins.</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-4">3</div>
              <h4 className="font-semibold mb-2">We deliver & pick up</h4>
              <p className="text-gray-600">Luggage arrives at your door. Return it the same way.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}