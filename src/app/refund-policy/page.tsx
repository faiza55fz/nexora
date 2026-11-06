
export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">
          SUNDAYSHOP POLICIES
        </p>

        <h1 className="mb-4 text-4xl font-bold text-ink">
          Refund & Cancellation Policy
        </h1>

        <p className="mb-10 text-sm text-muted">
          Last updated: November 1, 2026
        </p>

        <div className="space-y-8 text-muted leading-7">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              1. Order Cancellation
            </h2>
            <p>
              Customers may request cancellation before their order has been
              dispatched. Once an order has been dispatched, cancellation may
              not be possible. Please contact our support team as soon as
              possible for cancellation requests.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              2. Refund Eligibility
            </h2>
            <p className="mb-3">
              Refunds may be considered in the following situations:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>An eligible order is successfully cancelled before dispatch.</li>
              <li>A duplicate payment has been made for the same order.</li>
              <li>A payment is deducted but the order is not successfully placed.</li>
              <li>An incorrect, damaged or missing product is reported and verified.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              3. Fresh Fruits, Vegetables & Grocery Products
            </h2>
            <p>
              Since SundayShop offers fresh and perishable products, customers
              should report damaged, spoiled, incorrect or missing items as
              soon as possible after delivery. Please provide your order
              details and photographs where available so our team can review
              the issue.
            </p>
            <p className="mt-3">
              Refunds or other suitable resolutions will be considered after
              verification of the reported issue.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              4. Refund Process
            </h2>
            <p>
              Once a refund is approved, it will be initiated to the original
              payment method wherever possible. The time taken for the amount
              to appear in your account may depend on your bank or payment
              service provider.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              5. Non-Refundable Situations
            </h2>
            <p>
              Refunds may not be provided for products that have been
              incorrectly stored, handled or used after delivery, or for
              complaints that cannot be verified. This does not affect any
              rights available to customers under applicable consumer laws.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              6. How to Request a Refund
            </h2>
            <p>
              To request a cancellation or refund, contact our support team
              with your order ID, registered contact details and a description
              of the issue.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              7. Contact Us
            </h2>
            <p>For refund and cancellation assistance:</p>
            <p className="mt-3">
              <strong>Email:</strong>{" "}
              <a
                href="mailto:mmc.javed@gmail.com"
                className="text-brand underline"
              >
                mmc.javed@gmail.com
              </a>
            </p>
            <p>
              <strong>Phone:</strong> +91 9360001834
            </p>
            <p>
              <strong>Business Address:</strong> Krupa Nagar, Hubli,
              Karnataka – 580024, India
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
