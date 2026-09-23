"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowLeft, Phone, Mail } from "lucide-react";

const faqs = [
  {
    question: "Can I cancel my order?",
    answer:
      "Yes. You can cancel your order while it is still being processed. Once your order has been packed or dispatched, cancellation will no longer be available.",
  },
  {
    question: "Can I change my delivery address?",
    answer:
      "Yes. You can update your delivery address while your order is still being processed. Once the order has been dispatched, the address can no longer be changed.",
  },
  {
    question: "What happens if a product is out of stock?",
    answer:
      'If a product is out of stock, you won\'t be able to add it to your cart. You can choose "Notify me when available" and Nexora will notify you when the product is back in stock.',
  },
  {
    question: "What if I receive a damaged or incorrect product?",
    answer:
      "You can report the issue directly from your order. Select the affected product, choose Damaged or Incorrect item, add the details, and submit your request.",
  },
  {
    question: "What happens if an item becomes unavailable after I place my order?",
    answer:
      "If an item becomes unavailable after your order is placed, Nexora will mark that item as unavailable and it will not be included in your delivery. You will not be charged for an item that wasn't supplied.",
  },
  {
    question: "Can I add more items after placing my order?",
    answer:
      "Yes, if your order hasn't been packed yet. You can add available products to your existing order so they can be delivered together. Once your order is packed or dispatched, you will need to place a new order.",
  },
  {
    question: "What should I do if something is missing from my order?",
    answer:
      "Open your order and select Report an issue. Choose Missing item, select the product that wasn't included, and submit the request.",
  },
  {
    question: "How can I report a problem with my order?",
    answer:
      "Open the relevant order and select Report an issue. You can report a Missing item, Damaged item, or Incorrect item, add details, and submit the issue.",
  },
  {
    question: "Why is a product unavailable even though I saw it earlier?",
    answer:
      "Nexora uses current stock availability. If the remaining stock is purchased by another customer, the product can become unavailable immediately. This is especially common with fresh fruits, vegetables and other limited-stock products.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Back */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-muted">
            Nexora Help Center
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            FAQs & Help
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Find answers to common questions about your Nexora orders,
            products and delivery.
          </p>
        </div>

        {/* FAQs */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Frequently asked questions
          </h2>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={faq.question}
                  className="border-b border-line last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => toggleFAQ(index)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-surface-2 sm:px-5"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium leading-6 sm:text-base">
                      {faq.question}
                    </span>

                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-muted transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5">
                      <p className="text-sm leading-6 text-muted">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Contact Nexora</h2>

          <div className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm leading-6 text-muted">
              Need help with something that isn't covered here? Get in touch
              with Nexora and we'll help you with your order.
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href="tel:+91XXXXXXXXXX"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <Phone className="h-4 w-4" />
                Contact Nexora
              </a>

              <a
                href="mailto:support@hublibazar.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-medium transition-colors hover:bg-surface-2"
              >
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}