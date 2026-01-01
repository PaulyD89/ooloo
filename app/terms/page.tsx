import Link from 'next/link'

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: December 31, 2025</p>

        <div className="prose prose-gray max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to ooloo. These Terms of Service ("Terms") govern your use of our luggage rental service. By booking a rental, you agree to these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">2. Eligibility</h2>
            <p className="text-gray-600 mb-4">
              You must be at least 18 years old to use ooloo. By using our service, you represent that you are at least 18 and have the legal capacity to enter into this agreement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">3. The Service</h2>
            <p className="text-gray-600 mb-4">
              ooloo provides short-term luggage rentals with delivery and pickup. We deliver luggage to your specified address and retrieve it at the end of your rental period. You may also return luggage via UPS using our prepaid shipping labels.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">4. Booking and Payment</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>All prices are displayed in US dollars and include applicable fees</li>
              <li>Payment is due at the time of booking</li>
              <li>We accept major credit and debit cards via Stripe</li>
              <li>A delivery and pickup fee applies to all orders</li>
              <li>Rush fees may apply for next-day delivery requests</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">5. Cancellation and Refunds</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Cancel 48 or more hours before your scheduled delivery for a full refund</li>
              <li>Cancellations within 48 hours of delivery are not eligible for refund</li>
              <li>To cancel, use the "Manage Your Order" page or contact us</li>
              <li>Refunds are processed within 5-10 business days</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">6. Modifications</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Delivery or return address changes must be made at least 24 hours in advance</li>
              <li>Date changes are subject to availability</li>
              <li>To modify your order, use the "Manage Your Order" page or contact us</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">7. Your Responsibilities</h2>
            <p className="text-gray-600 mb-4">You agree to:</p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>Provide accurate delivery and contact information</li>
              <li>Be available during your selected delivery window or arrange for someone to receive the luggage</li>
              <li>Use the luggage only for lawful purposes</li>
              <li>Not pack prohibited items including hazardous materials, illegal substances, weapons, or perishable goods</li>
              <li>Return the luggage by the agreed-upon date and time</li>
              <li>Return the luggage in the same condition it was received, allowing for normal wear and tear</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">8. Damage and Loss</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>You are responsible for the luggage from delivery until pickup or return shipment</li>
              <li>Normal wear and tear is expected and accepted</li>
              <li>You may be charged for damage beyond normal wear and tear</li>
              <li>Lost or stolen luggage may result in a replacement fee up to the full value of the luggage</li>
              <li>Report any issues immediately to help@ooloo.co</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">9. Late Returns</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>If you need to extend your rental, contact us before your return date</li>
              <li>Late returns without prior arrangement may incur additional daily charges</li>
              <li>Luggage not returned within 14 days of the scheduled return date may be considered lost</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-1">
              <li>ooloo is not responsible for the contents of your luggage</li>
              <li>We recommend not packing irreplaceable items, valuables, or important documents</li>
              <li>Our liability is limited to the rental fees paid for your order</li>
              <li>We are not liable for indirect, incidental, or consequential damages</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">11. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              All content on ooloo, including logos, text, and images, is our property and protected by intellectual property laws. You may not use our branding without written permission.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to refuse service, cancel orders, or terminate accounts at our discretion, including for violation of these Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">13. Dispute Resolution</h2>
            <p className="text-gray-600 mb-4">
              Any disputes arising from these Terms or our service will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive any right to a jury trial or class action.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may modify these Terms at any time. Continued use of ooloo after changes constitutes acceptance of the new Terms. We will notify users of significant changes via email.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">16. Contact</h2>
            <p className="text-gray-600 mb-4">
              Questions about these Terms? Contact us at:
            </p>
            <p className="text-gray-600">
              Email: <a href="mailto:help@ooloo.co" className="text-cyan-600 hover:underline">help@ooloo.co</a>
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