import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a href="/" className="flex-shrink-0">
              <img 
                src="/oolooheaderlogo.png" 
                alt="ooloo - Rent the luggage. Own the trip." 
                className="h-10 sm:h-12"
              />
            </a>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/book" className="text-gray-700 hover:text-cyan-600 font-medium transition">
                Book Now
              </Link>
              <Link href="/order" className="text-gray-700 hover:text-cyan-600 font-medium transition">
                Manage Order
              </Link>
              <Link href="/faq" className="text-gray-700 hover:text-cyan-600 font-medium transition">
                Support
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-cyan-600 font-medium transition">
                Contact
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Link 
                href="/book"
                className="bg-cyan-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-cyan-600 transition"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Background */}
      <section className="relative bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
          <img 
            src="/oolooaltlogowithtag.png?v=3" 
            alt="ooloo - Rent the luggage. Own the trip." 
            className="h-40 sm:h-56 mx-auto mb-8"
          />
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Premium luggage delivered to your door. Return it when you're back.
            No storage, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/book"
              className="inline-block bg-cyan-500 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-cyan-600 transition shadow-lg hover:shadow-xl"
            >
              Book Your Luggage
            </Link>
            <Link
              href="/cities"
              className="inline-block bg-white text-gray-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition border border-gray-200"
            >
              View Cities
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-8 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 sm:gap-16 text-center">
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">✓</span>
              <span className="font-medium">Free Cancellation</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">✓</span>
              <span className="font-medium">Door-to-Door Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <span className="text-2xl">✓</span>
              <span className="font-medium">Premium Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <img 
              src="/howitworks.png" 
              alt="How It Works" 
              className="h-14 sm:h-20 mx-auto mb-4"
            />
            <p className="text-gray-600 text-lg">Three simple steps to travel lighter</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex justify-center">
              <img 
                src="/howitworks1.png" 
                alt="Step 1: Choose your dates" 
                className="w-full max-w-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src="/howitworks2.png" 
                alt="Step 2: Pick your bags" 
                className="w-full max-w-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
            <div className="flex justify-center">
              <img 
                src="/howitworks3.png" 
                alt="Step 3: We deliver & pick up" 
                className="w-full max-w-sm rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cities Section */}
      <section className="py-16 bg-gray-50 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Available in 7 Cities</h2>
          <p className="text-gray-600 mb-8">With more coming soon</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Los Angeles', 'New York', 'San Francisco', 'Chicago', 'Atlanta', 'Dallas', 'Denver'].map(city => (
              <span 
                key={city}
                className="px-4 py-2 bg-white rounded-full text-gray-700 border border-gray-200 text-sm font-medium"
              >
                {city}
              </span>
            ))}
          </div>
          <Link 
            href="/cities"
            className="inline-block mt-8 text-cyan-600 font-medium hover:underline"
          >
            See all cities →
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-gradient-to-br from-cyan-500 via-cyan-500 to-teal-500">
        <div className="max-w-2xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-6">Ready to travel lighter?</h3>
          <p className="text-cyan-100 text-lg mb-8">
            Book your luggage rental in minutes. Free cancellation up to 48 hours before delivery.
          </p>
          <Link
            href="/book"
            className="inline-block bg-white text-cyan-600 px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-50 transition shadow-lg hover:shadow-xl"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {/* Logo */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img src="/oolooicon.png" alt="ooloo" className="h-10" />
                <span className="text-white font-medium">ooloo</span>
              </div>
              <p className="text-sm">Rent the luggage. Own the trip.</p>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="text-white font-medium mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="hover:text-white transition">About Us</a></li>
                <li><a href="/#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="/cities" className="hover:text-white transition">Cities</a></li>
              </ul>
            </div>
            
            {/* Support */}
            <div>
              <h4 className="text-white font-medium mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="/faq" className="hover:text-white transition">FAQ</a></li>
                <li><a href="/contact" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="/order" className="hover:text-white transition">Manage Your Order</a></li>
              </ul>
            </div>
            
            {/* Legal */}
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