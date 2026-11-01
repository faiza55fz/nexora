import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-green-600">
          SUNDAYSHOP
        </p>

        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          Privacy Policy
        </h1>

        <p className="mb-10 text-sm text-gray-500">
          Last updated: November 1, 2026
        </p>

        <div className="space-y-8 leading-7 text-gray-600">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              1. Introduction
            </h2>
            <p>
              SundayShop respects your privacy. This Privacy Policy explains
              how we collect, use, store and protect information when you
              visit our website or use our services.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              2. Information We Collect
            </h2>
            <p>
              We may collect information such as your name, phone number,
              email address, delivery address, account details, order
              information and payment transaction details when you use
              SundayShop.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              3. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Create and manage your customer account.</li>
              <li>Process and deliver your orders.</li>
              <li>Send order updates and important notifications.</li>
              <li>Respond to customer support requests.</li>
              <li>Improve our website, products and services.</li>
              <li>Prevent fraud and maintain platform security.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              4. Payments
            </h2>
            <p>
              Online payments are processed through authorised payment
              service providers. SundayShop does not intend to store your
              complete card, UPI PIN or banking passwords. Payment
              information is handled according to the payment provider's
              applicable privacy and security practices.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              5. Sharing of Information
            </h2>
            <p>
              We may share relevant information with delivery partners,
              payment providers, technology service providers and other
              parties where necessary to operate our services, process
              orders, provide support or comply with legal obligations.
              We do not sell your personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              6. Data Security
            </h2>
            <p>
              We take reasonable measures to protect personal information
              against unauthorised access, misuse, alteration or disclosure.
              However, no online system can guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              7. Cookies
            </h2>
            <p>
              Our website may use cookies or similar technologies to
              maintain sessions, remember preferences and improve your
              browsing experience. You can manage cookies through your
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              8. Your Choices
            </h2>
            <p>
              You may contact us to request access to, correction of or
              deletion of your personal information, subject to applicable
              legal requirements and records we are required to retain.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Any
              updated version will be published on this page with a revised
              update date.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              10. Contact Us
            </h2>
            <p>
              For questions about this Privacy Policy or your personal
              information, contact us:
            </p>
            <p className="mt-3">
              Email:{" "}
              <a
                href="mailto:mmc.javed@gmail.com"
                className="font-semibold text-green-700 underline"
              >
                mmc.javed@gmail.com
              </a>
              <br />
              Address: Krupa Nagar, Hubli, Karnataka – 580024, India.
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-block font-medium text-green-700"
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}