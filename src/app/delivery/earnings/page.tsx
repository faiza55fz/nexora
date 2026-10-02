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
import { useEffect, useState } from "react";

type Period = "daily" | "weekly" | "monthly";

type EarningsRecord = {
  id: string;
  order_id: string | null;
  amount: number | string;
  base_amount: number | string;
  incentive_amount: number | string;
  tip_amount: number | string;
  block_date: string;
  block_start_time: string | null;
  block_end_time: string | null;
  status: string;
  settlement_type: string | null;
  settled_at: string | null;
  created_at: string;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  block: string;
  deliveries: number;
  base: number;
  incentive: number;
  tips: number;
  amount: number;
  status: string;
};

const rewards = [
  {
    title: "Fuel Reward",
    description: "₹300 fuel benefit earned this month",
    value: "₹300",
  },
  {
    title: "Maintenance Reward",
    description:
      "Eligible for partner vehicle maintenance benefits",
    value: "Eligible",
  },
  {
    title: "Dining Discount",
    description: "10% partner dining discount",
    value: "10% OFF",
  },
];



export default function DeliveryEarningsPage() {
  const [partnerId, setPartnerId] = useState("");
  const [earningsData, setEarningsData] = useState<
    EarningsRecord[]
  >([]);

  const [earningsSummary, setEarningsSummary] = useState({
    today: 0,
    weekly: 0,
    monthly: 0,
    totalEarned: 0,
    alreadyCashout: 0,
    availableBalance: 0,
  });

  const [earningsLoading, setEarningsLoading] =
    useState(true);
    const [weeklyBonus, setWeeklyBonus] = useState({
  completedDeliveries: 0,
  target: 10,
  reward: 100,
  earned: 0,
  progress: 0,
});
  const [selectedSettlement, setSelectedSettlement] =
  useState<"daily" | "weekly" | null>(null);
  const [payoutAccount, setPayoutAccount] = useState<any>(null);
const [payoutType, setPayoutType] = useState<"bank" | "upi">("bank");
const [accountHolderName, setAccountHolderName] = useState("");
const [accountNumber, setAccountNumber] = useState("");
const [ifscCode, setIfscCode] = useState("");
const [upiId, setUpiId] = useState("");
const [payoutLoading, setPayoutLoading] = useState(false);
const [payoutSaving, setPayoutSaving] = useState(false);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const storedSession = localStorage.getItem(
          "nexora-delivery-session",
        );
        

        if (!storedSession) {
          setEarningsLoading(false);
          return;
        }

        const session = JSON.parse(storedSession);

        const id = session?.memberId;
          

        if (!id) {
          setEarningsLoading(false);
          return;
        }

        setPartnerId(id);
fetch(`/api/delivery/payout-account?partnerId=${id}`)
  .then(async (response) => {
    if (!response.ok) {
      throw new Error("Failed to load payout account.");
    }

    return response.json();
  })
  .then((result) => {
    const account = result.payoutAccount;

    if (!account) {
      return;
    }

    setPayoutAccount(account);
    setPayoutType(account.payout_type);

    setAccountHolderName(
      account.account_holder_name ?? "",
    );

    setAccountNumber(
      account.account_number ?? "",
    );

    setIfscCode(account.ifsc_code ?? "");

    setUpiId(account.upi_id ?? "");
  })
  .catch((error) => {
    console.error(
      "Failed to load payout account:",
      error,
    );
  });


        const response = await fetch(
          `/api/delivery/earnings?partnerId=${encodeURIComponent(
            id,
          )}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          setEarningsLoading(false);
          return;
        }

        const data = await response.json();

        setEarningsData(
          Array.isArray(data?.earnings)
            ? data.earnings
            : [],
        );

        setEarningsSummary({
          today: Number(data?.summary?.today ?? 0),
          weekly: Number(data?.summary?.weekly ?? 0),
          monthly: Number(data?.summary?.monthly ?? 0),
          totalEarned: Number(
    data?.summary?.totalEarned ?? 0,
  ),
  alreadyCashout: Number(
    data?.summary?.alreadyCashout ?? 0,
  ),
          availableBalance: Number(
            data?.summary?.availableBalance ?? 0,
          ),
        });
       setWeeklyBonus({
  completedDeliveries: Number(
    data?.bonuses?.weeklyDelivery?.completedDeliveries ?? 0,
  ),
  target: Number(
    data?.bonuses?.weeklyDelivery?.target ?? 10,
  ),
  reward: Number(
    data?.bonuses?.weeklyDelivery?.reward ?? 100,
  ),
  earned: Number(
    data?.bonuses?.weeklyDelivery?.earned ?? 0,
  ),
  progress: Number(
    data?.bonuses?.weeklyDelivery?.progress ?? 0,
  ),
}); 
      } catch (error) {
        console.error(
          "Failed to load delivery earnings:",
          error,
        );
      } finally {
        setEarningsLoading(false);
      }
    };

    loadEarnings();
  }, []);

  const progressPercentage =
  weeklyBonus.target > 0
    ? Math.min(
        100,
        (weeklyBonus.progress / weeklyBonus.target) * 100,
      )
    : 0;

  const bonuses = [
  {
    title: "Weekly Delivery Bonus",
    description: "Complete 10 deliveries this week",
    progress: weeklyBonus.progress,
    target: weeklyBonus.target,
    reward: `₹${weeklyBonus.reward}`,
    earned: weeklyBonus.earned > 0,
  },
];
  const [period, setPeriod] =
    useState<Period>("weekly");

  const [historyFilter, setHistoryFilter] = useState<
    "all" | "completed" | "pending"
  >("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const getRecordsForPeriod = () => {
    const now = new Date();

    if (period === "daily") {
      return earningsData.filter((item) => {
        const date = new Date(item.created_at);

        return (
          date.toDateString() === now.toDateString()
        );
      });
    }

    if (period === "weekly") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = day === 0 ? 6 : day - 1;

      startOfWeek.setDate(
        startOfWeek.getDate() - diff,
      );
      startOfWeek.setHours(0, 0, 0, 0);

      return earningsData.filter(
        (item) =>
          new Date(item.created_at) >=
          startOfWeek,
      );
    }

    return earningsData.filter((item) => {
      const date = new Date(item.created_at);

      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    });
  };

  const periodRecords = getRecordsForPeriod();

  const earnings = {
    total:
      period === "daily"
        ? earningsSummary.today
        : period === "weekly"
          ? earningsSummary.weekly
          : earningsSummary.monthly,

    deliveries: periodRecords.length,

    base: periodRecords.reduce(
      (sum, item) =>
        sum + Number(item.base_amount ?? 0),
      0,
    ),

    incentives: periodRecords.reduce(
      (sum, item) =>
        sum + Number(item.incentive_amount ?? 0),
      0,
    ),

    tips: periodRecords.reduce(
      (sum, item) =>
        sum + Number(item.tip_amount ?? 0),
      0,
    ),
  };
  const blockEarnings = Object.values(
    earningsData.reduce(
      (groups, item) => {
        const blockKey = `${item.block_date}_${item.block_start_time ?? "default"}_${item.block_end_time ?? ""}`;

        if (!groups[blockKey]) {
          groups[blockKey] = {
            id: blockKey,
            date: item.block_date,
            startTime: item.block_start_time,
            endTime: item.block_end_time,
            deliveries: 0,
            base: 0,
            incentives: 0,
            tips: 0,
            total: 0,
          };
        }

        groups[blockKey].deliveries += 1;
        groups[blockKey].base += Number(
          item.base_amount ?? 0,
        );
        groups[blockKey].incentives += Number(
          item.incentive_amount ?? 0,
        );
        groups[blockKey].tips += Number(
          item.tip_amount ?? 0,
        );
        groups[blockKey].total += Number(
          item.amount ?? 0,
        );

        return groups;
      },
      {} as Record<
        string,
        {
          id: string;
          date: string;
          startTime: string | null;
          endTime: string | null;
          deliveries: number;
          base: number;
          incentives: number;
          tips: number;
          total: number;
        }
      >,
    ),
  );
  const filteredTransactions: Transaction[] =
    earningsData
      .map((item) => ({
        id: item.id,

        date: new Date(
          item.created_at,
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),

        description: item.order_id
          ? `Delivery earnings · Order ${item.order_id.slice(
              0,
              8,
            )}`
          : "Delivery earnings",

        block: item.block_start_time
          ? `${item.block_start_time}${
              item.block_end_time
                ? ` – ${item.block_end_time}`
                : ""
            }`
          : "Delivery block",

        deliveries: 1,

        base: Number(item.base_amount ?? 0),

        incentive: Number(
          item.incentive_amount ?? 0,
        ),

        tips: Number(item.tip_amount ?? 0),

        amount: Number(item.amount ?? 0),

        status:
          item.status === "completed"
            ? "Completed"
            : item.status === "pending"
              ? "Pending"
              : "Settled",
      }))
      .filter((transaction) => {
        const matchesFilter =
          historyFilter === "all" ||
          transaction.status.toLowerCase() ===
            historyFilter;

        const search =
          searchQuery.toLowerCase().trim();

        const matchesSearch =
          transaction.id
            .toLowerCase()
            .includes(search) ||
          transaction.date
            .toLowerCase()
            .includes(search) ||
          transaction.block
            .toLowerCase()
            .includes(search) ||
          transaction.description
            .toLowerCase()
            .includes(search);

        return matchesFilter && matchesSearch;
      });

      const handleSavePayoutAccount = async () => {
  if (!partnerId) {
    alert("Delivery partner session not found.");
    return;
  }

  setPayoutSaving(true);

  try {
    const response = await fetch(
      "/api/delivery/payout-account",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId,
          payoutType,
          accountHolderName,
          accountNumber,
          ifscCode,
          upiId,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
          "Unable to save payout account.",
      );
    }

    setPayoutAccount(result.payoutAccount);

    alert("Payout account saved successfully.");
  } catch (error) {
    console.error(
      "Failed to save payout account:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Unable to save payout account.",
    );
  } finally {
    setPayoutSaving(false);
  }
};

 const handleCashout = async () => {
  if (!partnerId) {
    alert("Delivery partner session not found.");
    return;
  }

  if (earningsSummary.availableBalance <= 0) {
   alert(
    `You have already cashed out your available earnings.\n\nAlready cashed out: ₹${earningsSummary.weekly - earningsSummary.availableBalance}\nAvailable to cash out: ₹0`,
  );
    return;
  }
  if (!payoutAccount) {
  alert(
    "Please add a payout account before requesting a cashout.",
  );
  return;
}
const balanceResponse = await fetch(
  `/api/delivery/earnings?partnerId=${encodeURIComponent(
    partnerId,
  )}`,
  {
    cache: "no-store",
  },
);

if (!balanceResponse.ok) {
  alert("Unable to refresh your available balance.");
  return;
}

const balanceData = await balanceResponse.json();

const latestAvailableBalance = Number(
  balanceData?.summary?.availableBalance ?? 0,
);

setEarningsSummary((prev) => ({
  ...prev,
  availableBalance: latestAvailableBalance,
}));

if (latestAvailableBalance <= 0) {
  alert("You do not have any available balance to cash out.");
  return;
}
console.log("CASHOUT DEBUG", {
  partnerId,
  amount: earningsSummary.availableBalance,
  payoutAccount,
});

  try {
    const response = await fetch(
      "/api/delivery/cashout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId,
          amount: latestAvailableBalance,
          paymentMethod: "instant",
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data?.error ??
          "Unable to create cashout request.",
      );
      return;
    }

    setEarningsSummary((prev) => ({
      ...prev,
      availableBalance: Number(
        data?.availableBalance ?? 0,
      ),
    }));

    const refreshedResponse = await fetch(
  `/api/delivery/earnings?partnerId=${encodeURIComponent(
    partnerId,
  )}`,
  {
    cache: "no-store",
  },
);

if (refreshedResponse.ok) {
  const refreshedData =
    await refreshedResponse.json();

  setEarningsSummary((prev) => ({
    ...prev,
    availableBalance: Number(
      refreshedData?.summary?.availableBalance ?? 0,
    ),
  }));
}

    alert(
      "Cashout request created successfully.",
    );
  } catch (error) {
    console.error(
      "Cashout failed:",
      error,
    );

    alert(
      "Unable to process cashout request.",
    );
  }
};

 const handleSettlement = async (
  type: "daily" | "weekly",
) => {
  if (!partnerId) {
    alert("Delivery partner session not found.");
    return;
  }

  try {
    const response = await fetch(
      "/api/delivery/settlement",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerId,
          settlementType: type,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data?.error ??
          "Unable to save settlement preference.",
      );
      return;
    }

    alert(
      data?.message ??
        `${
          type === "daily"
            ? "Daily"
            : "Weekly"
        } settlement selected.`,
    );
  } catch (error) {
    console.error(
      "Settlement preference update failed:",
      error,
    );

    alert(
      "Unable to save settlement preference.",
    );
  }
}; 

  return (
    <main className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
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

        <section className="rounded-2xl bg-foreground p-5 text-ink shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm text-muted">
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
                    <p className="font-bold">
                      Total Earnings
                    </p>

                    <p className="mt-1 leading-5 text-muted">
                      Your earnings from completed
                      deliveries, including base pay,
                      incentives and tips.
                    </p>
                  </div>
                </div>

                <span className="text-4xl font-bold">
                  {earnings.total.toLocaleString(
                    "en-IN",
                  )}
                </span>
              </div>

              <p className="mt-2 text-sm text-muted">
                {earnings.deliveries} deliveries
                completed
              </p>
            </div>

            <button
              type="button"
              onClick={handleCashout}
              className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800"
            >
              <ArrowDownToLine size={17} />
              Instant Cashout
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
            <div>
              <p className="text-xs text-ink">
                Base earnings
              </p>

              <p className="mt-1 font-semibold">
                ₹{earnings.base.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink">
                Incentives
              </p>

              <p className="mt-1 font-semibold">
                ₹{earnings.incentives.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-ink">
                Tips
              </p>

              <p className="mt-1 font-semibold">
                ₹{earnings.tips.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>
            <div>
    <p className="text-xs text-ink">
      Already cashed out
    </p>

    <p className="mt-1 font-semibold">
      ₹{earningsSummary.alreadyCashout.toLocaleString(
        "en-IN",
      )}
    </p>
  </div>

  <div>
    <p className="text-xs text-ink">
      Available to cash out
    </p>

    <p className="mt-1 font-semibold">
      ₹{earningsSummary.availableBalance.toLocaleString(
        "en-IN",
      )}
    </p>
  </div>

          </div>
        </section>

        <section className="rounded-xl border border-border bg-white p-2">
  <div className="flex gap-2">
    {(["daily", "weekly", "monthly"] as Period[]).map(
      (item) => (
        <button
          key={item}
          type="button"
          onClick={() => setPeriod(item)}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold capitalize ${
            period === item
              ? "bg-teal-700 text-white"
              : "bg-[#f4f5f7] text-muted hover:bg-teal-50"
          }`}
        >
          {item}
        </button>
      ),
    )}
  </div>
</section>

        <section className="mt-5">
  <div className="mb-3 flex items-center gap-2">
    <Wallet size={19} />
    <h2 className="font-bold">
      Settlement
    </h2>
  </div>

  <div className="grid gap-4 md:grid-cols-2">
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
          onClick={() => {
            setSelectedSettlement("daily");
            handleSettlement("daily");
          }}
          className={`rounded-xl border px-5 py-3 font-medium transition ${
            selectedSettlement === "daily"
              ? "border-teal-700 bg-teal-700 text-white"
              : "border-teal-700 bg-white text-teal-700 hover:bg-teal-50"
          }`}
        >
          {selectedSettlement === "daily"
            ? "Selected"
            : "Select"}
        </button>
      </div>
    </div>

    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">
            Weekly settlement
          </p>

          <p className="mt-1 text-xs text-muted">
            Receive your accumulated weekly
            earnings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedSettlement("weekly");
            handleSettlement("weekly");
          }}
          className={`rounded-xl border px-5 py-3 font-medium transition ${
            selectedSettlement === "weekly"
              ? "border-teal-700 bg-teal-700 text-white"
              : "border-teal-700 bg-white text-teal-700 hover:bg-teal-50"
          }`}
        >
          {selectedSettlement === "weekly"
            ? "Selected"
            : "Select"}
        </button>
      </div>
    </div>
  </div>
</section>

        <section className="mt-7">
  <div className="mb-3 flex items-center gap-2">
    <CalendarDays size={19} />
    <h2 className="font-bold">
      Block-wise earnings
    </h2>
  </div>

  <div className="overflow-hidden rounded-2xl border border-line bg-white">
    {blockEarnings.length > 0 ? (
      blockEarnings.slice(0, 4).map((block) => (
        <div
          key={block.id}
          className="border-b border-line p-4 last:border-b-0"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {new Date(
                  block.date,
                ).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              <p className="mt-1 text-xs text-muted">
                {block.startTime
                  ? `${block.startTime}${
                      block.endTime
                        ? ` – ${block.endTime}`
                        : ""
                    }`
                  : "Delivery block"}
              </p>

              <p className="mt-1 text-xs text-muted">
                {block.deliveries}{" "}
                {block.deliveries === 1
                  ? "delivery"
                  : "deliveries"}
              </p>
            </div>

            <p className="font-bold">
              ₹
              {block.total.toLocaleString(
                "en-IN",
              )}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3">
            <div>
              <p className="text-[11px] text-muted">
                Base
              </p>

              <p className="mt-1 text-sm font-semibold">
                ₹{block.base.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted">
                Incentive
              </p>

              <p className="mt-1 text-sm font-semibold">
                ₹
                {block.incentives.toLocaleString(
                  "en-IN",
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted">
                Tips
              </p>

              <p className="mt-1 text-sm font-semibold">
                ₹{block.tips.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="p-6 text-center text-sm text-muted">
        No block earnings yet.
      </div>
    )}
  </div>
</section>

        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <ReceiptText size={19} />
            <h2 className="font-bold">
              Earnings history
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="border-b border-line p-4">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) =>
                    setSearchQuery(e.target.value)
                  }
                  placeholder="Search by ID, date or block..."
                  className="w-full rounded-xl border border-line bg-[#f7f8fa] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto border-b border-line p-3">
              {(
                ["all", "completed", "pending"] as const
              ).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() =>
                    setHistoryFilter(filter)
                  }
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold capitalize ${
                    historyFilter === filter
                        ? "bg-teal-700 text-white"
                       : "bg-[#f4f5f7] text-muted hover:bg-teal-50"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(
                (transaction) => (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() =>
                      setSelectedTransaction(
                        transaction,
                      )
                    }
                    className="flex w-full items-center justify-between border-b border-line p-4 text-left transition hover:bg-[#fafafa] last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {transaction.description}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {transaction.date} ·{" "}
                        {transaction.id}
                      </p>

                      <p
                        className={`mt-1 text-xs font-medium ${
                          transaction.status ===
                          "Completed"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {transaction.status}
                      </p>
                    </div>

                    <div className="ml-4 flex items-center gap-2">
                      <p className="font-bold">
                        +₹
                        {transaction.amount.toLocaleString(
                          "en-IN",
                        )}
                      </p>

                      <ChevronRight
                        size={16}
                        className="text-muted"
                      />
                    </div>
                  </button>
                ),
              )
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
                    className="h-full rounded-full bg-teal-700 transition-all duration-500"
                    style={{
                      width: `${
                           bonus.target > 0
                             ? Math.min(
                               (bonus.progress / bonus.target) * 100,
                               100,
                             )
                        : 0
                      }%`,
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

        <section className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <Gift size={19} />
            <h2 className="font-bold">
              Partner rewards
            </h2>
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
                View and download your earnings statements
                and tax-related documents.
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

       <section className="mt-4 rounded-2xl border border-line bg-white p-5">
  <div className="flex items-start gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4f5f7]">
      <Banknote size={18} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm font-bold">
        Payout account
      </p>

      <p className="mt-1 text-xs text-muted">
        Add the bank account or UPI ID where your
        earnings should be settled.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => setPayoutType("bank")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            payoutType === "bank"
              ? "bg-brand text-white"
              : "border border-line bg-white text-muted"
          }`}
        >
          Bank account
        </button>

        <button
          type="button"
          onClick={() => setPayoutType("upi")}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            payoutType === "upi"
              ? "bg-brand text-white"
              : "border border-line bg-white text-muted"
          }`}
        >
          UPI
        </button>
      </div>

      {payoutType === "bank" ? (
        <div className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Account holder name"
            value={accountHolderName}
            onChange={(event) =>
              setAccountHolderName(event.target.value)
            }
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />

          <input
            type="text"
            placeholder="Bank account number"
            value={accountNumber}
            onChange={(event) =>
              setAccountNumber(event.target.value)
            }
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />

          <input
            type="text"
            placeholder="IFSC code"
            value={ifscCode}
            onChange={(event) =>
              setIfscCode(event.target.value.toUpperCase())
            }
            className="w-full rounded-lg border border-line px-3 py-2 text-sm uppercase outline-none focus:border-brand"
          />
        </div>
      ) : (
        <div className="mt-4">
          <input
            type="text"
            placeholder="UPI ID"
            value={upiId}
            onChange={(event) =>
              setUpiId(event.target.value)
            }
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
      )}

      <button
        type="button"
        onClick={handleSavePayoutAccount}
        disabled={payoutSaving}
        className="mt-4 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
      >
        {payoutSaving
          ? "Saving..."
          : payoutAccount
            ? "Update payout account"
            : "Save payout account"}
      </button>

      {payoutAccount?.is_verified && (
        <p className="mt-2 text-xs font-medium text-green-600">
          Payout account verified
        </p>
      )}
    </div>
  </div>
</section> 

        <div className="mt-6 flex items-center justify-center gap-2 pb-6 text-xs text-muted">
          <ShieldCheck size={14} />
          Your earnings and settlement information is
          securely handled.
        </div>
      </div>

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
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
                onClick={() =>
                  setSelectedTransaction(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f5f7]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 rounded-xl bg-[#f7f8fa] p-4">
              <p className="text-xs text-muted">
                Total earned
              </p>

              <p className="mt-1 text-2xl font-bold">
                ₹
                {selectedTransaction.amount.toLocaleString(
                  "en-IN",
                )}
              </p>

              <p
                className={`mt-1 text-xs font-semibold ${
                  selectedTransaction.status ===
                  "Completed"
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {selectedTransaction.status}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted">
                  Date
                </span>

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
                    ₹
                    {selectedTransaction.amount.toLocaleString(
                      "en-IN",
                    )}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedTransaction(null)
              }
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