
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">
          SUNDAYSHOP
        </p>

        <h1 className="mb-4 text-4xl font-bold text-ink">
          Pricing
        </h1>

        <p className="mb-10 text-sm text-muted">
          Transparent pricing for your everyday shopping.
        </p>

        <div className="space-y-8 leading-7 text-muted">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              1. Product Prices
            </h2>
            <p>
              All product prices are displayed on their respective
              product pages. Prices may vary depending on product
              availability, quantity and applicable offers.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              2. Delivery Charges
            </h2>
            <p>
              Delivery charges may vary depending on the customer's
              delivery location. The applicable delivery charge will
              be calculated and displayed during checkout before
              the order is confirmed.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              3. Final Order Amount
            </h2>
            <p>
              The final order amount will include the prices of
              selected products and any applicable delivery charges
              or additional fees. Customers can review the complete
              amount before proceeding with payment.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              4. Offers and Discounts
            </h2>
            <p>
              Promotional offers and discounts may be available
              from time to time. Applicable offers will be displayed
              on the website or during checkout, subject to their
              respective terms and conditions.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              5. Price Changes
            </h2>
            <p>
              SundayShop reserves the right to update product prices,
              delivery charges and promotional offers when necessary.
              The applicable prices will be shown before the customer
              completes the order.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              6. Payments
            </h2>
            <p>
              Customers can review the final order amount before
              completing payment through the available payment
              options at checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              7. Contact Us
            </h2>
            <p>
              For questions regarding product prices, delivery
              charges or payments, contact us:
            </p>
            <p className="mt-3">
              Email:{" "}
              <a
                href="mailto:mmc.javed@gmail.com"
                className="font-semibold text-brand underline"
              >
                mmc.javed@gmail.com
              </a>
            </p>
          </section>
        </div>

        <Link
          href="/"
          className="mt-10 inline-block font-medium text-brand hover:underline"
        >
          ← Back to Home
        </Link>
      </section>
    </main>
  );
}
