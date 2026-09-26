
"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowDownToLine,
  Banknote,
  CalendarDays,
  ChevronRight,
  Gift,
  IndianRupee,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

type Period = "daily" | "weekly" | "monthly";

const earningsByPeriod = {
  daily: {
    total: 1850,
    deliveries: 12,
    base: 1500,
    incentives: 250,
    tips: 100,
  },
  weekly: {
    total: 10850,
    deliveries: 71,
    base: 8750,
    incentives: 1450,
    tips: 650,
  },
  monthly: {
    total: 42800,
    deliveries: 286,
    base: 34200,
    incentives: 6100,
    tips: 2500,
  },
};

const blockEarnings = [
  {
    date: "Sep 26",
    block: "10:00 AM – 2:00 PM",
    deliveries: 8,
    amount: 720,
  },
  {
    date: "Sep 25",
    block: "5:00 PM – 9:00 PM",
    deliveries: 11,
    amount: 980,
  },
  {
    date: "Sep 24",
    block: "10:00 AM – 2:00 PM",
    deliveries: 7,
    amount: 650,
  },
  {
    date: "Sep 23",
    block: "5:00 PM – 9:00 PM",
    deliveries: 10,
    amount: 890,
  },
];

const transactions = [
  {
    id: "NXR-10284",
    date: "Sep 26, 2026",
    description: "Delivery earnings",
    block: "10:00 AM – 2:00 PM",
    deliveries: 8,
    base: 620,
    incentive: 70,
    tips: 30,
    amount: 720,
    status: "Completed",
  },
  {
    id: "NXR-10271",
    date: "Sep 25, 2026",
    description: "Delivery earnings",
    block: "5:00 PM – 9:00 PM",
    deliveries: 11,
    base: 820,
    incentive: 120,
    tips: 40,
    amount: 980,
    status: "Completed",
  },
  {
    id: "NXR-10253",
    date: "Sep 24, 2026",
    description: "Delivery earnings",
    block: "10:00 AM – 2:00 PM",
    deliveries: 7,
    base: 570,
    incentive: 50,
    tips: 30,
    amount: 650,
    status: "Completed",
  },
  {
    id: "NXR-10241",
    date: "Sep 23, 2026",
    description: "Delivery earnings",
    block: "5:00 PM – 9:00 PM",
    deliveries: 10,
    base: 760,
    incentive: 90,
    tips: 40,
    amount: 890,
    status: "Pending",
  },
];

const rewards = [
  {
    title: "Fuel Reward",
    description: "₹300 fuel benefit earned this month",
    value: "₹300",
  },
  {
    title: "Maintenance Reward",
    description: "Eligible for partner vehicle maintenance benefits",
    value: "Eligible",
  },
  {
    title: "Dining Discount",
    description: "10% partner dining discount",
    value: "10% OFF",
  },
];

const bonuses = [
  {
    title: "Weekly Delivery Bonus",
    description: "Complete 75 deliveries this week",
    progress: 71,
    target: 75,
    reward: "₹750",
  },
  {
    title: "On-Time Bonus",
    description: "Maintain 95%+ on-time deliveries",
    progress: 94,
    target: 95,
    reward: "₹500",
  },
];

export default function DeliveryEarningsPage() {
  const [period, setPeriod] = useState<Period>("weekly");

  // Earnings history state
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "completed" | "pending"
  >("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTransaction, setSelectedTransaction] = useState<
    (typeof transactions)[number] | null
  >(null);

  const earnings = earningsByPeriod[period];

  // Filter earnings history
  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter =
      historyFilter === "all" ||
      transaction.status.toLowerCase() === historyFilter;

    const search = searchQuery.toLowerCase().trim();

    const matchesSearch =
      transaction.id.toLowerCase().includes(search) ||
      transaction.date.toLowerCase().includes(search) ||
      transaction.block.toLowerCase().includes(search);

    return matchesFilter && matchesSearch;
  });

  const handleCashout = () => {
    alert(
      "Instant Pay is ready for integration. Your available balance will be sent to your registered payout account.",
    );
  };

  const handleSettlement = (type: "daily" | "weekly") => {
    alert(
      `${type === "daily" ? "Daily" : "Weekly"} settlement preference selected.`,
    );
  };

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/delivery"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white"
            aria-label="Back to delivery dashboard"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-xl font-bold text-foreground">
              Earnings & Settlement
            </h1>

            <p className="text-sm text-muted">
              Track your deliveries, earnings and rewards
            </p>
          </div>
        </div>

        {/* Main earnings card */}
        <section className="rounded-2xl bg-foreground p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-white/65">
                {period === "daily"
                  ? "Today's earnings"
                  : period === "weekly"
                    ? "This week's earnings"
                    : "This month's earnings"}
              </p>

              <div className="mt-2 flex items-center gap-1">
                <div className="group relative flex items-center">
                  <div className="flex h-7 w-7 cursor-help items-center justify-center rounded-full">
                    <IndianRupee size={28} />
                  </div>

                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 hidden w-56 -translate-x-1/2 rounded-xl bg-white p-3 text-left text-xs text-foreground shadow-lg group-hover:block">
                    <p className="font-bold">Total Earnings</p>

                    <p className="mt-1 leading-5 text-muted">
                      Your earnings from completed deliveries, including base
                      pay, incentives and tips.
                    </p>
                  </div>
                </div>

                <span className="text-4xl font-bold">
                  {earnings.total.toLocaleString("en-IN")}
                </span>
              </div>

              <p className="mt-2 text-sm text-white/65">
                {earnings.deliveries} deliveries completed
              </p>
            </div>

            <button
              type="button"
              onClick={handleCashout}
              className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-foreground"
            >
              <ArrowDownToLine size={17} />
              Instant Cashout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs text-white/55">Base earnings</p>

              <p className="mt-1 font-semibold">
                ₹{earnings.base.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/55">Incentives</p>

              <p className="mt-1 font-semibold">
                ₹{earnings.incentives.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-xs text-white/55">Tips</p>

              <p className="mt-1 font-semibold">
                ₹{earnings.tips.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </section>

        {/* Period selector */}
        <section className="mt-5 rounded-2xl border border-line bg-white p-4">
          <div className="flex gap-2">
            {(["daily", "weekly", "monthly"] as Period[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPeriod(item)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold capitalize ${
                  period === item
                    ? "bg-foreground text-white"
                    : "bg-[#f4f5f7] text-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Settlement */}
        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2">
            <Wallet size={19} />
            <h2 className="font-bold">Settlement</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">

            {/* Daily */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Daily settlement
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Receive eligible earnings every day.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSettlement("daily")}
                  className="rounded-lg border border-line px-3 py-2 text-xs font-semibold"
                >
                  Select
                </button>
              </div>
            </div>

            {/* Weekly */}
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">
                    Weekly settlement
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Receive your accumulated weekly earnings.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSettlement("weekly")}
                  className="rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-white"
                >
                  Selected
                </button>
              </div>
            </div>

          </div>
        </section>

        {/* Block-wise earnings */}
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays size={19} />
            <h2 className="font-bold">Block-wise earnings</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            {blockEarnings.map((block) => (
              <div
                key={`${block.date}-${block.block}`}
                className="flex items-center justify-between border-b border-line p-4 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {block.date}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {block.block}
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    {block.deliveries} deliveries
                  </p>
                </div>

                <p className="font-bold">
                  ₹{block.amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Earnings history */}
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <ReceiptText size={19} />
            <h2 className="font-bold">Earnings history</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white">

            {/* Search */}
            <div className="border-b border-line p-4">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID, date or block..."
                  className="w-full rounded-xl border border-line bg-[#f7f8fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto border-b border-line p-3">
              {(["all", "completed", "pending"] as const).map(
                (filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setHistoryFilter(filter)}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                      historyFilter === filter
                        ? "bg-foreground text-white"
                        : "bg-[#f4f5f7] text-muted"
                    }`}
                  >
                    {filter}
                  </button>
                ),
              )}
            </div>

            {/* Transactions */}
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <button
                  key={transaction.id}
                  type="button"
                  onClick={() =>
                    setSelectedTransaction(transaction)
                  }
                  className="flex w-full items-center justify-between border-b border-line p-4 text-left transition hover:bg-[#fafafa] last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      {transaction.description}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {transaction.date} · {transaction.id}
                    </p>

                    <p
                      className={`mt-1 text-xs font-medium ${
                        transaction.status === "Completed"
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {transaction.status}
                    </p>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    <p className="font-bold">
                      +₹{transaction.amount.toLocaleString("en-IN")}
                    </p>

                    <ChevronRight
                      size={16}
                      className="text-muted"
                    />
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center">
                <ReceiptText
                  size={28}
                  className="mx-auto text-muted"
                />

                <p className="mt-3 text-sm font-semibold">
                  No earnings found
                </p>

                <p className="mt-1 text-xs text-muted">
                  Try changing your filter or search.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Bonuses */}
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles size={19} />
            <h2 className="font-bold">
              Bonuses & incentives
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bonuses.map((bonus) => (
              <div
                key={bonus.title}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold">
                      {bonus.title}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                      {bonus.description}
                    </p>
                  </div>

                  <span className="whitespace-nowrap rounded-lg bg-[#f4f5f7] px-2.5 py-1 text-xs font-bold">
                    {bonus.reward}
                  </span>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#edf0f2]">
                  <div
                    className="h-full rounded-full bg-foreground"
                    style={{
                      width: `${Math.min(
                        (bonus.progress / bonus.target) * 100,
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted">
                  {bonus.progress} / {bonus.target}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Rewards */}
        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Gift size={19} />
            <h2 className="font-bold">Partner rewards</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {rewards.map((reward) => (
              <div
                key={reward.title}
                className="rounded-2xl border border-line bg-white p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f5f7]">
                  <Gift size={18} />
                </div>

                <p className="mt-4 text-sm font-bold">
                  {reward.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-muted">
                  {reward.description}
                </p>

                <p className="mt-3 text-sm font-bold">
                  {reward.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tax documents */}
        <section className="mt-7 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f7]">
              <ReceiptText size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                Tax documents & statements
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                View and download your earnings statements and
                tax-related documents.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  "Tax statements will be available here once the settlement system is connected.",
                )
              }
              className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs font-semibold"
            >
              View
            </button>
          </div>
        </section>

        {/* Account / payout info */}
        <section className="mt-4 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f7]">
              <Banknote size={18} />
            </div>

            <div>
              <p className="text-sm font-bold">
                Payout account
              </p>

              <p className="mt-1 text-xs text-muted">
                Earnings are settled to your registered payout
                account.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex items-center justify-center gap-2 pb-6 text-xs text-muted">
          <ShieldCheck size={14} />
          Your earnings and settlement information is securely handled.
        </div>
      </div>

      {/* Transaction details modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">

            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">
                  Earning details
                </p>

                <p className="mt-1 text-xs text-muted">
                  {selectedTransaction.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f5f7]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total */}
            <div className="mt-5 rounded-xl bg-[#f7f8fa] p-4">
              <p className="text-xs text-muted">
                Total earned
              </p>

              <p className="mt-1 text-2xl font-bold">
                ₹{selectedTransaction.amount.toLocaleString("en-IN")}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  selectedTransaction.status === "Completed"
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {selectedTransaction.status}
              </p>
            </div>

            {/* Details */}
            <div className="mt-5 space-y-4">

              <div className="flex justify-between text-sm">
                <span className="text-muted">Date</span>

                <span className="font-medium">
                  {selectedTransaction.date}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted">
                  Delivery block
                </span>

                <span className="font-medium">
                  {selectedTransaction.block}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted">
                  Deliveries
                </span>

                <span className="font-medium">
                  {selectedTransaction.deliveries}
                </span>
              </div>

              <div className="border-t border-line pt-4">

                <div className="flex justify-between text-sm">
                  <span className="text-muted">
                    Base earnings
                  </span>

                  <span>
                    ₹{selectedTransaction.base}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">
                    Incentive
                  </span>

                  <span>
                    ₹{selectedTransaction.incentive}
                  </span>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-muted">
                    Tips
                  </span>

                  <span>
                    ₹{selectedTransaction.tips}
                  </span>
                </div>

                <div className="mt-3 flex justify-between border-t border-line pt-3 font-bold">
                  <span>Total</span>

                  <span>
                    ₹{selectedTransaction.amount.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>

              </div>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={() => setSelectedTransaction(null)}
              className="mt-6 w-full rounded-xl bg-foreground py-3 text-sm font-semibold text-white"
            >
              Done
            </button>

          </div>
        </div>
      )}
    </main>
  );
}
