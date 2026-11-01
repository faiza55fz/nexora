
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-green-600">ABOUT SUNDAYSHOP</p>

        <h1 className="mb-6 text-4xl font-bold text-gray-900">
          Fresh groceries, delivered with care.
        </h1>

        <p className="mb-5 text-lg leading-8 text-gray-600">
          SundayShop is an online grocery shopping platform that makes it
          convenient to shop for everyday essentials, fresh fruits,
          vegetables and other grocery products.
        </p>

        <p className="mb-5 leading-7 text-gray-600">
          Our aim is to make grocery shopping simple by bringing a range of
          products together in one place. Customers can browse products,
          place orders and get their groceries delivered conveniently.
        </p>

        <p className="mb-10 leading-7 text-gray-600">
          We are committed to providing a convenient shopping experience,
          clear product information and helpful customer support.
        </p>

        <div className="rounded-2xl bg-green-50 p-6">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Get in touch
          </h2>
          <p className="mb-4 text-gray-600">
            Have a question or need help with an order? Contact our support
            team.
          </p>
          <a
            href="mailto:mmc.javed@gmail.com"
            className="font-semibold text-green-700 underline"
          >
            mmc.javed@gmail.com
          </a>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Business address: Krupa Nagar, Hubli, Karnataka – 580024
        </p>

        <Link href="/" className="mt-8 inline-block font-medium text-green-700">
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
