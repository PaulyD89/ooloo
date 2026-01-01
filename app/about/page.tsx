import Link from 'next/link'

export default function AboutPage() {
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

      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h1 className="text-4xl font-bold mb-4">About ooloo</h1>
        <p className="text-xl text-gray-600">Rent the luggage. Own the trip.</p>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 pb-16">
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold mb-4">The Problem</h2>
            <p className="text-gray-600 mb-4">
              Luggage is expensive, bulky, and sits in your closet 350 days a year. When you do travel, you're stuck with whatever you bought years ago—or you shell out hundreds for new bags you'll barely use.
            </p>
            <p className="text-gray-600">
              And if you're traveling light but come home loaded with souvenirs? You're buying overpriced luggage at the airport or stuffing things into shopping bags.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Solution</h2>
            <p className="text-gray-600 mb-4">
              ooloo delivers premium luggage to your door before your trip and picks it up when you're back. No storage, no hassle, no commitment.
            </p>
            <p className="text-gray-600">
              Need bags for a week? A month? Just one way? We've got you covered. Our luggage is designed in-house and manufactured by the same factories that produce today's leading premium brands—so you get high-end quality without the high-end price tag.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How We're Different</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border">
                <div className="text-3xl mb-3">🚪</div>
                <h3 className="font-semibold mb-2">Door-to-Door</h3>
                <p className="text-gray-600 text-sm">We deliver and pick up. No trips to a store, no shipping headaches.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <div className="text-3xl mb-3">✨</div>
                <h3 className="font-semibold mb-2">Premium Quality</h3>
                <p className="text-gray-600 text-sm">Our bags are built to the same standards as top luggage brands.</p>
              </div>
              <div className="bg-white p-6 rounded-xl border">
                <div className="text-3xl mb-3">🔄</div>
                <h3 className="font-semibold mb-2">Flexible Returns</h3>
                <p className="text-gray-600 text-sm">Return in a different city or ship it back via UPS. Your choice.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600">
              We believe travel should be lighter—literally. By making premium luggage accessible without the burden of ownership, we're helping people travel smarter, more sustainably, and with less stuff weighing them down.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-cyan-50 border border-cyan-100 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to travel lighter?</h3>
          <p className="text-gray-600 mb-6">Book your first rental in minutes.</p>
          <Link
            href="/book"
            className="inline-block bg-gray-900 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition"
          >
            Book Now
          </Link>
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