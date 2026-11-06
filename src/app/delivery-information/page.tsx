
import Link from "next/link";

export default function DeliveryInformationPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-3 font-semibold text-brand">
          SUNDAYSHOP
        </p>

        <h1 className="mb-4 text-4xl font-bold text-ink">
          Delivery Information
        </h1>

        <p className="mb-10 text-sm text-muted">
          Everything you need to know about SundayShop deliveries.
        </p>

        <div className="space-y-8 leading-7 text-muted">
          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              1. Delivery Availability
            </h2>
            <p>
              SundayShop provides delivery of groceries, fruits
              and other available products to supported locations.
              Delivery availability depends on the customer's
              delivery address.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              2. Placing an Order
            </h2>
            <p>
              Customers can browse products, add their selections
              to the cart and provide their delivery address during
              checkout. Orders are processed after successful
              order confirmation.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              3. Delivery Charges
            </h2>
            <p>
              Delivery charges depend on the delivery location.
              The applicable delivery fee will be displayed during
              checkout before the customer completes the order.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              4. Delivery Time
            </h2>
            <p>
              Estimated delivery information, wherever available,
              will be communicated during the ordering process.
              Actual delivery times may vary depending on location,
              product availability and other circumstances.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              5. Order Tracking and Updates
            </h2>
            <p>
              Customers may receive order status updates through
              the available notification or order tracking
              features on SundayShop.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              6. Delivery Delays
            </h2>
            <p>
              Delivery may occasionally be delayed due to
              unforeseen circumstances, traffic, weather conditions
              or operational issues. Customers will be informed
              through available communication channels whenever
              possible.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-xl font-semibold text-ink">
              7. Customer Support
            </h2>
            <p>
              For assistance with deliveries or order-related
              questions, contact our support team:
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
