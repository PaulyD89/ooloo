import Link from 'next/link'

export default function ContactPage() {
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
        <h1 className="text-4xl font-bold mb-2">Contact Us</h1>
        <p className="text-gray-600 mb-12">We're here to help. Reach out anytime.</p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Email */}
          <div className="bg-white p-8 rounded-xl border">
            <div className="text-3xl mb-4">📧</div>
            <h2 className="text-xl font-semibold mb-2">Email Us</h2>
            <p className="text-gray-600 mb-4">For general inquiries and support</p>
            <a 
              href="mailto:help@ooloo.co" 
              className="text-cyan-600 font-medium hover:underline"
            >
              help@ooloo.co
            </a>
          </div>

          {/* Response Time */}
          <div className="bg-white p-8 rounded-xl border">
            <div className="text-3xl mb-4">⏱️</div>
            <h2 className="text-xl font-semibold mb-2">Response Time</h2>
            <p className="text-gray-600 mb-4">We typically respond within</p>
            <p className="text-cyan-600 font-medium">A few hours</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-gray-50 rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-6">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a 
              href="/order" 
              className="bg-white p-4 rounded-lg border hover:border-cyan-300 transition text-center"
            >
              <div className="text-2xl mb-2">📦</div>
              <p className="font-medium">Manage Your Order</p>
              <p className="text-sm text-gray-500">Track, edit, or cancel</p>
            </a>
            <a 
              href="/faq" 
              className="bg-white p-4 rounded-lg border hover:border-cyan-300 transition text-center"
            >
              <div className="text-2xl mb-2">❓</div>
              <p className="font-medium">FAQ</p>
              <p className="text-sm text-gray-500">Common questions</p>
            </a>
            <a 
              href="/book" 
              className="bg-white p-4 rounded-lg border hover:border-cyan-300 transition text-center"
            >
              <div className="text-2xl mb-2">🧳</div>
              <p className="font-medium">Book Now</p>
              <p className="text-sm text-gray-500">Start a new rental</p>
            </a>
          </div>
        </div>

        {/* Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Have an active rental? You can also reply directly to any of our SMS notifications.
          </p>
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