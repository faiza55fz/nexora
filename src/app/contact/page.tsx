
import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">
          CONTACT SUNDAYSHOP
        </p>

        <h1 className="mb-6 text-4xl font-bold text-ink">
          We're here to help.
        </h1>

        <p className="mb-10 text-lg leading-8 text-muted">
          Have a question about an order, a product, or our services?
          Get in touch with our support team.
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-line p-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">
              Email Support
            </h2>
            <p className="mb-3 text-muted">
              Contact us by email for assistance.
            </p>
            <a
              href="mailto:mmc.javed@gmail.com"
              className="font-semibold text-brand underline"
            >
              mmc.javed@gmail.com
            </a>
          </div>

          <div className="rounded-2xl border border-line p-6">
            <h2 className="mb-3 text-xl font-semibold text-ink">
              Phone Support
            </h2>
            <p className="mb-3 text-muted">
              Call us for customer support.
            </p>
            <p className="font-semibold text-ink">
              +91 9360001834
            </p>
          </div>

          <div className="rounded-2xl border border-line p-6 md:col-span-2">
            <h2 className="mb-3 text-xl font-semibold text-ink">
              Business Address
            </h2>
            <p className="leading-7 text-muted">
              Krupa Nagar,
              <br />
              Hubli, Karnataka – 580024,
              <br />
              India.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-10 inline-block font-medium text-brand"
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
