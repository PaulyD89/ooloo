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
        <div className="max-w-7xl mx-auto px-6 py-16 sm:py-20">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left - Text */}
            <div className="text-center md:text-left">
              <img 
                src="/oolooaltlogowithtag.png?v=3" 
                alt="ooloo - Rent the luggage. Own the trip." 
                className="h-32 sm:h-44 md:h-52 mx-auto md:mx-0 mb-6"
              />
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg">
                Premium luggage delivered to your door. Return it when you're back.
                No storage, no hassle.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
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
            
            {/* Right - Luggage Image */}
            <div className="flex justify-center md:justify-end">
              <img 
                src="/hero-luggagev3.png" 
                alt="ooloo premium luggage - carry-on, medium, and large sizes" 
                className="w-full max-w-md lg:max-w-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Video */}
      <section className="py-16 sm:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <img 
              src="/howitworks.png" 
              alt="How It Works" 
              className="h-14 sm:h-20 mx-auto mb-4"
            />
            <p className="text-gray-600 text-lg">See how easy it is to travel lighter</p>
          </div>
          
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <video 
              className="w-full"
              controls
              poster="/hero-luggagev3.png"
              playsInline
            >
              <source src="/ooloo-promo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-100 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Book Early & Save */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <img 
                src="/icon-save.png" 
                alt="Save money" 
                className="h-16 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Book Early & Save</h3>
              <p className="text-gray-600 mb-4">
                Book 60+ days in advance and save up to 20% on your rental.
              </p>
              <Link 
                href="/book"
                className="inline-block px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Book now
              </Link>
            </div>

            {/* Premium Bags */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <img 
                src="/icon-luggage.png" 
                alt="Premium luggage" 
                className="h-16 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Bags, Simple Pricing</h3>
              <p className="text-gray-600 mb-4">
                One daily rate, no hidden fees. Carry-on, medium, or large—you choose.
              </p>
              <Link 
                href="/book"
                className="inline-block px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                See pricing
              </Link>
            </div>

            {/* One-Way Trips */}
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <img 
                src="/icon-shipping.png" 
                alt="UPS shipping" 
                className="h-16 mx-auto mb-4"
              />
              <h3 className="text-xl font-bold text-gray-900 mb-2">One-Way Trips Welcome</h3>
              <p className="text-gray-600 mb-4">
                Flying home to a city we don't serve? No problem—return via prepaid UPS label.
              </p>
              <Link 
                href="/faq"
                className="inline-block px-6 py-2 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Learn more
              </Link>
            </div>
          </div>
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