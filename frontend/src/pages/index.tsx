import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <section className="bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            AI-Powered Shopping
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600 dark:text-gray-300">
            Discover products recommended just for you. Secure, smart, and seamless.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/products"
              className="rounded-lg bg-primary-600 px-8 py-3 text-white hover:bg-primary-700"
            >
              Shop Now
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-gray-300 px-8 py-3 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-2xl font-bold text-center mb-12">Why AI-Shop?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {[
            { title: 'AI Recommendations', desc: 'Personalized product suggestions powered by machine learning.' },
            { title: 'Secure Payments', desc: 'End-to-end encryption, MFA, and fraud detection built in.' },
            { title: 'Smart Analytics', desc: 'Real-time insights into your shopping behavior and trends.' },
          ].map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 p-6 text-center dark:border-gray-800">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
