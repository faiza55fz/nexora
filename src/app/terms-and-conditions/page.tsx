
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">SUNDAYSHOP</p>

        <h1 className="mb-4 text-4xl font-bold text-ink">
          Terms & Conditions
        </h1>

        <p className="mb-10 text-sm text-muted">
          Last updated: November 1, 2026
        </p>

        <div className="space-y-8 leading-7 text-muted">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">1. Introduction</h2>
            <p>
              These Terms & Conditions govern your use of the SundayShop
              website and services. By accessing the website or placing an
              order, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">2. Our Services</h2>
            <p>
              SundayShop provides an online platform for browsing and
              purchasing groceries, fruits, vegetables and other available
              products. Product availability and delivery coverage may vary
              depending on your location.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">3. Customer Accounts</h2>
            <p>
              You are responsible for providing accurate account and delivery
              information and keeping your login credentials secure. Please
              notify us if you suspect unauthorised use of your account.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">4. Orders and Acceptance</h2>
            <p>
              Placing an order is a request to purchase the selected products.
              Orders are subject to product availability, serviceability and
              confirmation by SundayShop. We may contact you if an order
              requires clarification or cannot be fulfilled.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">5. Product Information</h2>
            <p>
              We aim to display accurate product descriptions, images and
              prices. Actual product appearance, size, weight or packaging may
              vary. Fresh produce may naturally vary in colour, shape and size.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">6. Pricing and Payments</h2>
            <p>
              Prices are displayed on the website and may change from time to
              time. Applicable delivery charges and other fees, if any, will
              be shown before checkout. Payments must be made using the
              payment methods offered at checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">7. Delivery</h2>
            <p>
              Delivery estimates are indicative and may be affected by
              location, weather, traffic, product availability or other
              circumstances. Please provide a complete and accurate delivery
              address and contact number.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">8. Cancellation, Returns and Refunds</h2>
            <p>
              Order cancellation, returns and refunds are governed by our
              Refund & Cancellation Policy. Please review that policy before
              placing an order.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">9. Acceptable Use</h2>
            <p>
              You agree not to misuse the website, provide false information,
              interfere with its operation or attempt unauthorised access to
              accounts, systems or data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">10. Limitation of Liability</h2>
            <p>
              SundayShop will make reasonable efforts to provide reliable
              services. To the extent permitted by applicable law, we are not
              responsible for indirect losses arising from temporary service
              interruptions or circumstances beyond our reasonable control.
              Nothing in these terms excludes liability that cannot legally
              be excluded.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">11. Privacy</h2>
            <p>
              Your use of SundayShop is also subject to our Privacy Policy,
              which explains how we handle personal information.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">12. Changes to These Terms</h2>
            <p>
              We may update these terms from time to time. Updated terms will
              be published on this page with a revised update date.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">13. Contact Us</h2>
            <p>
              For questions about these terms, contact us at:
              <br />
              Email:{" "}
              <a
                href="mailto:mmc.javed@gmail.com"
                className="font-semibold text-brand underline"
              >
                mmc.javed@gmail.com
              </a>
              <br />
              Address: Krupa Nagar, Hubli, Karnataka – 580024, India.
            </p>
          </section>
        </div>

        <Link href="/" className="mt-10 inline-block font-medium text-brand">
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
