import Link from 'next/link'

export default function PrivacyPage() {
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
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: December 31, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
            <p className="text-gray-600 mb-4">
              ooloo ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our luggage rental service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
            <p className="text-gray-600 mb-4"><strong>Information you provide:</strong></p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Name, email address, and phone number</li>
              <li>Delivery and pickup addresses</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Communications with our support team</li>
            </ul>
            <p className="text-gray-600 mb-4"><strong>Information collected automatically:</strong></p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage data (pages visited, booking activity)</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Process and fulfill your luggage rental orders</li>
              <li>Deliver, pick up, and track your rental</li>
              <li>Send booking confirmations, reminders, and delivery updates via email and SMS</li>
              <li>Process payments and refunds</li>
              <li>Respond to customer support inquiries</li>
              <li>Improve our service and user experience</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">How We Share Your Information</h2>
            <p className="text-gray-600 mb-4">We share your information only as necessary to provide our service:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li><strong>Delivery drivers:</strong> Name, phone number, and address for delivery/pickup</li>
              <li><strong>Payment processing:</strong> Stripe processes all payments; we do not store full credit card numbers</li>
              <li><strong>Communications:</strong> Twilio powers our SMS notifications</li>
              <li><strong>Shipping partners:</strong> UPS for ship-back returns (name and address only)</li>
              <li><strong>Analytics:</strong> We may use analytics services to understand how our service is used</li>
            </ul>
            <p className="text-gray-600 mb-4">We do not sell your personal information to third parties.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Data Retention</h2>
            <p className="text-gray-600 mb-4">
              We retain your personal information for as long as necessary to provide our services and fulfill the purposes described in this policy. Order history is retained for accounting and legal compliance. You may request deletion of your data at any time.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Your Rights</h2>
            <p className="text-gray-600 mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Opt out of marketing communications</li>
              <li>Request a copy of your data</li>
            </ul>
            <p className="text-gray-600 mb-4">To exercise these rights, contact us at privacy@ooloo.co.</p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Cookies</h2>
            <p className="text-gray-600 mb-4">
              We use cookies to improve your experience, remember your preferences, and analyze site traffic. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, or destruction. Payment information is encrypted and processed securely through Stripe.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              Our service is not directed to children under 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about this Privacy Policy, contact us at:
            </p>
            <p className="text-gray-600">
              Email: <a href="mailto:privacy@ooloo.co" className="text-cyan-600 hover:underline">privacy@ooloo.co</a>
            </p>
          </section>
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