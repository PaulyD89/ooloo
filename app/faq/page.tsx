import Link from 'next/link'

export default function FAQPage() {
  const faqs = [
    {
      question: "How does it work?",
      answer: `Select your travel dates, choose your bags, and we deliver them to your door before your trip. When you're back, we pick them up. No trips to a store, no storage headaches.

Traveling light but shopping heavy? If you're abroad and run out of room for everything you bought, skip buying overpriced luggage at the airport. Book a one-way ooloo rental, have it delivered to your hotel, and ship it home with your new stuff inside. We'll include a prepaid UPS label.`
    },
    {
      question: "Where do you deliver?",
      answer: "We currently serve Los Angeles, New York, San Francisco, Chicago, Atlanta, Dallas-Fort Worth, and Denver. We're adding new cities all the time, so check back soon if you don't see yours yet."
    },
    {
      question: "How much does it cost?",
      answer: "Pricing depends on the bag and rental duration. A carry-on starts around $8/day, larger checked bags around $12-15/day. There's a flat $19.99 delivery and pickup fee. The longer you rent, the better the daily rate."
    },
    {
      question: "What luggage do you carry?",
      answer: "We designed our own line of luggage built exclusively for ooloo. Our bags are manufactured by the same factories that produce today's leading premium luggage brands—so you get high-end quality at a fraction of the cost of buying."
    },
    {
      question: "How far in advance should I book?",
      answer: "We recommend booking at least 3 days ahead, though we can often accommodate last-minute requests (a $9.99 rush fee applies for next-day delivery). Book 60+ days early and get 10% off."
    },
    {
      question: "Can I change my delivery or return address?",
      answer: "Yes, up to 24 hours before your scheduled delivery or pickup. Use the \"Manage Your Order\" page or contact us."
    },
    {
      question: "What if I need to cancel?",
      answer: "Cancel at least 48 hours before delivery for a full refund. Use the \"Manage Your Order\" page."
    },
    {
      question: "What if I'm returning from a different city?",
      answer: "No problem. You can select a different return city at checkout, or choose UPS Ship Back if you're ending your trip somewhere we don't serve yet. We'll include a prepaid shipping label."
    },
    {
      question: "What's included with the luggage?",
      answer: "Each bag comes clean and ready to pack. You can add a Travel Pack ($9.99) which includes a toiletry bag to keep your essentials organized."
    },
    {
      question: "What if a bag gets damaged during my trip?",
      answer: "Normal wear and tear is expected. For significant damage, contact us and we'll work it out—we know travel can be rough."
    },
    {
      question: "Do I need to be home for delivery?",
      answer: "Someone should be available during your selected delivery window (morning, afternoon, or evening). We'll text you when the driver is on the way."
    },
    {
      question: "How do I contact support?",
      answer: "Email us at help@ooloo.co or reply to any of our text messages. We typically respond within a few hours."
    }
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
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-600 mb-10">Everything you need to know about renting with ooloo.</p>

        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-8">
              <h2 className="text-xl font-semibold mb-3">{faq.question}</h2>
              <p className="text-gray-600 whitespace-pre-line">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-cyan-50 border border-cyan-100 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-gray-600 mb-6">We're here to help. Reach out anytime.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:help@ooloo.co"
              className="inline-block border border-gray-300 px-6 py-3 rounded-full font-medium hover:bg-white transition"
            >
              Email Us
            </a>
            <Link
              href="/book"
              className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition"
            >
              Book Now
            </Link>
          </div>
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