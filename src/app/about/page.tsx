
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">ABOUT SUNDAYSHOP</p>

        <h1 className="mb-6 text-4xl font-bold text-ink">
          Fresh groceries, delivered with care.
        </h1>

        <p className="mb-5 text-lg leading-8 text-muted">
          SundayShop is an online grocery shopping platform that makes it
          convenient to shop for everyday essentials, fresh fruits,
          vegetables and other grocery products.
        </p>

        <p className="mb-5 leading-7 text-muted">
          Our aim is to make grocery shopping simple by bringing a range of
          products together in one place. Customers can browse products,
          place orders and get their groceries delivered conveniently.
        </p>

        <p className="mb-10 leading-7 text-muted">
          We are committed to providing a convenient shopping experience,
          clear product information and helpful customer support.
        </p>

        <div className="rounded-2xl bg-brand-soft p-6">
          <h2 className="mb-2 text-xl font-semibold text-ink">
            Get in touch
          </h2>
          <p className="mb-4 text-muted">
            Have a question or need help with an order? Contact our support
            team.
          </p>
          <a
            href="mailto:mmc.javed@gmail.com"
            className="font-semibold text-brand underline"
          >
            mmc.javed@gmail.com
          </a>
        </div>

        <p className="mt-8 text-sm text-muted">
          Business address: Krupa Nagar, Hubli, Karnataka – 580024
        </p>

        <Link href="/" className="mt-8 inline-block font-medium text-brand">
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
