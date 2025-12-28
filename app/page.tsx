import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="p-6">
        <a href="/">
          <img 
            src="/oolooicon.png" 
            alt="ooloo" 
            className="h-16"
          />
        </a>
      </header>

      {/* Hero */}
<section className="px-6 py-16 max-w-2xl mx-auto text-center">
  <img 
    src="/oolooaltlogowithtag.png?v=3" 
    alt="ooloo - Rent the luggage. Own the trip." 
    className="h-56 mx-auto mb-10"
  />
  <p className="text-xl text-gray-600 mb-10">
    Premium luggage delivered to your door. Return it when you're back.
    No storage, no hassle.
  </p>
  <Link
    href="/book"
    className="inline-block bg-gray-900 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-800 transition shadow-lg hover:shadow-xl"
  >
    Book Now
  </Link>
</section>

      {/* How it works */}
<section className="py-16 px-6">
  <div className="max-w-6xl mx-auto">
    <div className="text-center mb-12">
      <img 
        src="/howitworks.png" 
        alt="How It Works" 
        className="h-16 md:h-20 mx-auto mb-4"
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
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <img src="/oolooicon.png" alt="ooloo" className="h-10 rounded" />
            <span className="text-white font-medium">ooloo</span>
          </div>
          <p className="text-sm">© 2025 ooloo. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}