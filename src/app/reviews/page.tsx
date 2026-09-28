"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
type Review = {
  id: number;
  name: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  media: string[];
};

type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  order_items: OrderItem[];
};

const initialReviews: Review[] = [
  {
    id: 1,
    name: "Aarav",
    rating: 5,
    date: "2 days ago",
    text: "Very smooth experience. The delivery was quick and everything arrived safely.",
    verified: true,
    helpful: 24,
    notHelpful: 2,
    media: [],
  },
  {
    id: 2,
    name: "Priya",
    rating: 4,
    date: "5 days ago",
    text: "Good service overall. Delivery was on time and the order was handled carefully.",
    verified: true,
    helpful: 17,
    notHelpful: 1,
    media: [],
  },
  {
    id: 3,
    name: "Rahul",
    rating: 3,
    date: "1 week ago",
    text: "The experience was okay. Delivery took a little longer than expected.",
    verified: false,
    helpful: 8,
    notHelpful: 3,
    media: [],
  },
];

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [media, setMedia] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState("relevant");
  const [filterRating, setFilterRating] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const [message, setMessage] = useState("");

  /*
   * Load the selected order.
   *
   * The Rate & Review button passes:
   * /reviews?orderId=YOUR_ORDER_ID
   */
  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setOrderLoading(false);
        return;
      }

      try {
        setOrderLoading(true);

       const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.access_token) {
  setMessage("Please log in to review your order.");
  return;
}

const response = await fetch("/api/orders/my", {
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
  cache: "no-store",
});

        const result = await response.json();

        if (!response.ok || !result.success) {
          setMessage(
            result.error || "Unable to load your order.",
          );
          return;
        }

        const foundOrder = (result.orders || []).find(
          (item: Order) => item.id === orderId,
        );

        if (!foundOrder) {
          setMessage("Order not found.");
          return;
        }

        setOrder(foundOrder);

        if (foundOrder.status !== "delivered") {
          setMessage(
            "You can submit a review only after your order is delivered.",
          );
        }
      } catch (error) {
        console.error("Loading review order failed:", error);

        setMessage("Unable to load your order.");
      } finally {
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const ratingCounts = useMemo(() => {
    return [5, 4, 3, 2, 1].map(
      (star) =>
        reviews.filter(
          (review) => review.rating === star,
        ).length,
    );
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];

    if (filterRating !== "all") {
      result = result.filter(
        (review) =>
          review.rating === Number(filterRating),
      );
    }

    if (verifiedOnly) {
      result = result.filter(
        (review) => review.verified,
      );
    }

    if (sortBy === "newest") {
      result.sort((a, b) => b.id - a.id);
    }

    if (sortBy === "highest") {
      result.sort((a, b) => b.rating - a.rating);
    }

    if (sortBy === "lowest") {
      result.sort((a, b) => a.rating - b.rating);
    }

    if (sortBy === "helpful") {
      result.sort((a, b) => b.helpful - a.helpful);
    }

    return result;
  }, [
    reviews,
    filterRating,
    verifiedOnly,
    sortBy,
  ]);

  const handleMediaUpload = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(
      event.target.files || [],
    );

    const previews = files.map((file) =>
      URL.createObjectURL(file),
    );

    setMedia((current) => [
      ...current,
      ...previews,
    ]);
  };

  const removeMedia = (index: number) => {
    setMedia((current) =>
      current.filter((_, i) => i !== index),
    );
  };

  const submitReview = async () => {
    if (!orderId) {
      setMessage(
        "Please open this page from a delivered order.",
      );
      return;
    }

    if (!order) {
      setMessage("Order information is not available.");
      return;
    }

    if (order.status !== "delivered") {
      setMessage(
        "You can review a product only after the order is delivered.",
      );
      return;
    }

    if (rating === 0) {
      setMessage("Please select a star rating.");
      return;
    }

    if (!reviewText.trim()) {
      setMessage(
        "Please write a review before submitting.",
      );
      return;
    }

    /*
     * The API needs:
     * orderId
     * productId
     * rating
     * title
     * review
     *
     * Product selection will be added using the
     * purchased products from this delivered order.
     */

    const selectedProduct =
      order.order_items?.[0];

    if (!selectedProduct) {
      setMessage(
        "No products were found in this order.",
      );
      return;
    }

    /*
     * IMPORTANT:
     * Your current /api/reviews endpoint requires:
     *
     * Authorization: Bearer <Supabase access token>
     *
     * We are not adding a fake token here.
     *
     * Once we connect your existing login/session token,
     * this POST will save the review permanently.
     */

    try {
      setMessage("Submitting review...");

      const {
  data: { session },
} = await supabase.auth.getSession();

if (!session?.access_token) {
  setMessage("Please log in to submit a review.");
  return;
}

const response = await fetch("/api/reviews", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
        body: JSON.stringify({
          orderId: order.id,
          productId: selectedProduct.product_id,
          rating,
          title: null,
          review: reviewText.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error ||
            "Unable to submit your review.",
        );
        return;
      }

      const newReview: Review = {
        id: Date.now(),
        name: order.customer_name || "You",
        rating,
        date: "Just now",
        text: reviewText.trim(),
        verified: true,
        helpful: 0,
        notHelpful: 0,
        media,
      };

      setReviews((current) => [
        newReview,
        ...current,
      ]);

      setRating(0);
      setHoverRating(0);
      setReviewText("");
      setMedia([]);
      setShowForm(false);

      setMessage(
        "Review submitted successfully!",
      );
    } catch (error) {
      console.error(
        "Submitting review failed:",
        error,
      );

      setMessage(
        "Unable to submit your review.",
      );
    }
  };

  const voteHelpful = (
    id: number,
    helpful: boolean,
  ) => {
    setReviews((current) =>
      current.map((review) =>
        review.id === id
          ? {
              ...review,
              helpful: helpful
                ? review.helpful + 1
                : review.helpful,
              notHelpful: helpful
                ? review.notHelpful
                : review.notHelpful + 1,
            }
          : review,
      ),
    );
  };

  const deliveredOrder =
    order?.status === "delivered";

  return (
    <main className="min-h-screen bg-[#f8f9fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Customer Experience
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">
              Reviews & Ratings
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              See what customers are saying and share your own experience.
            </p>
          </div>

          {orderId && deliveredOrder ? (
            <button
              onClick={() => {
                setShowForm((value) => !value);
                setMessage("");
              }}
              className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              {showForm
                ? "Close Review"
                : "Write a Review"}
            </button>
          ) : null}
        </div>

        {/* Order information */}
        {orderId && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
            {orderLoading ? (
              <p className="text-gray-500">
                Checking your order...
              </p>
            ) : order ? (
              <div>
                <p className="font-semibold text-gray-900">
                  Order #{order.order_number}
                </p>

                <p className="mt-1 text-gray-500">
                  Status:{" "}
                  <span className="font-medium capitalize">
                    {order.status}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-gray-500">
                Unable to find this order.
              </p>
            )}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
            {message}
          </div>
        )}

        {/* Rating Summary */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[180px_1fr]">

            <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-6 md:border-b-0 md:border-r md:pb-0 md:pr-6">

              <div className="text-5xl font-bold text-gray-900">
                {averageRating}
              </div>

              <div className="mt-2 flex text-lg text-yellow-500">
                {"★★★★★"}
              </div>

              <p className="mt-2 text-sm text-gray-500">
                {reviews.length} reviews
              </p>

            </div>

            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(
                (star, index) => {
                  const count =
                    ratingCounts[index];

                  const percentage =
                    reviews.length
                      ? (count /
                          reviews.length) *
                        100
                      : 0;

                  return (
                    <div
                      key={star}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="w-8 text-gray-600">
                        {star}★
                      </span>

                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-yellow-400"
                          style={{
                            width: `${percentage}%`,
                          }}
                        />
                      </div>

                      <span className="w-8 text-right text-gray-500">
                        {count}
                      </span>
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        {/* Write Review */}
        {showForm &&
          deliveredOrder && (
            <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

              <h2 className="text-xl font-bold text-gray-900">
                Write a Review
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tell other customers about your experience.
              </p>

              {/* Stars */}
              <div className="mt-6">

                <p className="mb-2 text-sm font-semibold text-gray-800">
                  Your rating
                </p>

                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(
                    (star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() =>
                          setHoverRating(star)
                        }
                        onMouseLeave={() =>
                          setHoverRating(0)
                        }
                        onClick={() =>
                          setRating(star)
                        }
                        className="text-3xl transition-transform hover:scale-110"
                        aria-label={`${star} star rating`}
                      >
                        <span
                          className={
                            star <=
                            (hoverRating ||
                              rating)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }
                        >
                          ★
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>

              {/* Review */}
              <div className="mt-6">

                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Your review
                </label>

                <textarea
                  value={reviewText}
                  onChange={(event) =>
                    setReviewText(
                      event.target.value,
                    )
                  }
                  maxLength={500}
                  rows={5}
                  placeholder="Write about your experience..."
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-gray-400"
                />

                <div className="mt-1 text-right text-xs text-gray-400">
                  {reviewText.length}/500
                </div>
              </div>

              {/* Media */}
              <div className="mt-5">

                <p className="mb-2 text-sm font-semibold text-gray-800">
                  Add photos or videos
                </p>

                <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50">
                  + Add Photos / Videos

                  <input
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={
                      handleMediaUpload
                    }
                  />
                </label>

                {media.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {media.map(
                      (item, index) => (
                        <div
                          key={`${item}-${index}`}
                          className="relative h-20 w-20 overflow-hidden rounded-xl bg-gray-100"
                        >
                          <img
                            src={item}
                            alt="Review upload preview"
                            className="h-full w-full object-cover"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeMedia(index)
                            }
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white"
                          >
                            ×
                          </button>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={submitReview}
                  className="rounded-xl bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Submit Review
                </button>
              </div>
            </section>
          )}

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-bold text-gray-900">
                Customer Reviews
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Filter and sort reviews to find the feedback you need.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none"
              >
                <option value="relevant">
                  Most Relevant
                </option>

                <option value="newest">
                  Newest
                </option>

                <option value="highest">
                  Highest Rating
                </option>

                <option value="lowest">
                  Lowest Rating
                </option>

                <option value="helpful">
                  Most Helpful
                </option>
              </select>

              <select
                value={filterRating}
                onChange={(event) =>
                  setFilterRating(
                    event.target.value,
                  )
                }
                className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none"
              >
                <option value="all">
                  All Ratings
                </option>

                <option value="5">
                  5 Stars
                </option>

                <option value="4">
                  4 Stars
                </option>

                <option value="3">
                  3 Stars
                </option>

                <option value="2">
                  2 Stars
                </option>

                <option value="1">
                  1 Star
                </option>
              </select>

            </div>
          </div>

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-gray-600">

            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(event) =>
                setVerifiedOnly(
                  event.target.checked,
                )
              }
              className="h-4 w-4"
            />

            Show only verified purchases

          </label>
        </section>

        {/* Reviews */}
        <section className="space-y-4">

          {filteredReviews.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">

              <div className="text-4xl">
                ☆
              </div>

              <h3 className="mt-3 font-bold text-gray-900">
                No reviews found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try changing your filters.
              </p>

            </div>
          ) : (
            filteredReviews.map(
              (review) => (
                <article
                  key={review.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                    <div>

                      <div className="flex items-center gap-2">

                        <h3 className="font-semibold text-gray-900">
                          {review.name}
                        </h3>

                        {review.verified && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            ✓ Verified Purchase
                          </span>
                        )}

                      </div>

                      <div className="mt-2 flex items-center gap-3">

                        <span className="text-lg text-yellow-400">
                          {"★".repeat(
                            review.rating,
                          )}

                          <span className="text-gray-200">
                            {"★".repeat(
                              5 -
                                review.rating,
                            )}
                          </span>
                        </span>

                        <span className="text-xs text-gray-400">
                          {review.date}
                        </span>

                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {review.text}
                  </p>

                  {review.media.length >
                    0 && (
                    <div className="mt-4 flex flex-wrap gap-3">

                      {review.media.map(
                        (item, index) => (
                          <img
                            key={`${item}-${index}`}
                            src={item}
                            alt="Customer review media"
                            className="h-24 w-24 rounded-xl object-cover"
                          />
                        ),
                      )}

                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">

                    <span className="text-xs text-gray-500">
                      Was this review helpful?
                    </span>

                    <button
                      onClick={() =>
                        voteHelpful(
                          review.id,
                          true,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      👍 Helpful{" "}
                      {review.helpful}
                    </button>

                    <button
                      onClick={() =>
                        voteHelpful(
                          review.id,
                          false,
                        )
                      }
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      👎 Not Helpful{" "}
                      {review.notHelpful}
                    </button>

                  </div>
                </article>
              ),
            )
          )}

        </section>
      </div>
    </main>
  );
}