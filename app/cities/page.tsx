import Link from 'next/link'

export default function CitiesPage() {
  const cities = [
    { name: 'Los Angeles', state: 'CA', slug: 'los-angeles' },
    { name: 'New York', state: 'NY', slug: 'new-york' },
    { name: 'San Francisco', state: 'CA', slug: 'san-francisco' },
    { name: 'Chicago', state: 'IL', slug: 'chicago' },
    { name: 'Atlanta', state: 'GA', slug: 'atlanta' },
    { name: 'Dallas-Fort Worth', state: 'TX', slug: 'dallas-fort-worth' },
    { name: 'Denver', state: 'CO', slug: 'denver' },
  ]

  const comingSoon = [
    { name: 'Miami', state: 'FL' },
    { name: 'Seattle', state: 'WA' },
    { name: 'Boston', state: 'MA' },
    { name: 'Phoenix', state: 'AZ' },
    { name: 'Las Vegas', state: 'NV' },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="p-6 border-b bg-white">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <a href="/">
            <img src="/oolooicon.png" alt="ooloo" className="h-12" />
          </a>
          <Link
            href="/book"
            className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition"
          >
            Book Now
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Cities We Serve</h1>
        <p className="text-gray-600 mb-12">Delivery and pickup available in these metro areas.</p>

        {/* Active Cities */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            Now Available
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {cities.map((city) => (
              <Link
                key={city.name}
                href={`/book?city=${city.slug}`}
                className="bg-white p-6 rounded-xl border hover:border-cyan-300 hover:shadow-md transition flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg">{city.name}</p>
                  <p className="text-gray-500">{city.state}</p>
                </div>
                <span className="text-cyan-600 font-medium">Book →</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
            Coming Soon
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {comingSoon.map((city) => (
              <div
                key={city.name}
                className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-lg text-gray-600">{city.name}</p>
                  <p className="text-gray-400">{city.state}</p>
                </div>
                <span className="text-gray-400 text-sm">Coming soon</span>
              </div>
            ))}
          </div>
        </div>

        {/* UPS Ship Back Note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-8">
          <h3 className="text-xl font-semibold mb-2">Traveling somewhere else?</h3>
          <p className="text-gray-600 mb-4">
            Even if we don't serve your destination yet, you can still use ooloo. Choose "UPS Ship Back" at checkout and we'll include a prepaid return label. Drop off at any UPS location when you're done.
          </p>
          <Link
            href="/book"
            className="inline-block text-cyan-600 font-medium hover:underline"
          >
            Start booking →
          </Link>
        </div>

        {/* Request a City */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 mb-2">Don't see your city?</p>
          <a 
            href="mailto:help@ooloo.co?subject=City Request" 
            className="text-cyan-600 font-medium hover:underline"
          >
            Let us know where you'd like us next
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/oolooicon.png" alt="ooloo" className="h-10" />
                <span className="text-white font-medium">ooloo</span>
              </div>
              <p className="text-sm">Rent the luggage. Own the trip.</p>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white transition">About Us</a></li>
                <li><a href="/#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="/cities" className="hover:text-white transition">Cities</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="/order" className="hover:text-white transition">Manage Your Order</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/terms" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="/privacy" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2025 ooloo. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="https://instagram.com/ooloo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Instagram</a>
              <a href="https://twitter.com/ooloo" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Twitter</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}