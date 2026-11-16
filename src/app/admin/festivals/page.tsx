
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Campaign = {
  id: string;
  festival_name: string;
  campaign_name: string;
  heading: string | null;
  subtitle: string | null;
  theme: string;
  background_color: string | null;
  button_text: string | null;
  status: "draft" | "published" | "paused";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
};

export default function FestivalsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadCampaigns() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/festival-campaigns");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load campaigns.");
      }

      setCampaigns(result.campaigns ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }


  async function updateCampaignStatus(
    id: string,
    status: "published" | "paused",
  ) {
    try {
      const response = await fetch("/api/admin/festival-campaigns", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to update campaign.");
      }

      await loadCampaigns();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong.",
      );
    }
  }


  useEffect(() => {
    loadCampaigns();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Festival Campaigns
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage festive offers for your customers.
          </p>
        </div>

        <Link
          href="/admin/festivals/new"
          className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          + Create Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Campaigns</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {campaigns.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Published</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {campaigns.filter((item) => item.status === "published").length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Drafts</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {campaigns.filter((item) => item.status === "draft").length}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
          Loading campaigns...
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white p-12 text-center">
          <div className="text-4xl">🎉</div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            No festival campaigns yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Create your first campaign to start planning a festive sale.
          </p>
          <Link
            href="/admin/festivals/new"
            className="mt-5 inline-flex rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold text-gray-900">All Campaigns</h2>
          </div>

          <div className="divide-y">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">
                    {campaign.campaign_name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {campaign.festival_name}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Theme: {campaign.theme}
                  </p>
                </div>

                                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      campaign.status === "published"
                        ? "bg-green-100 text-green-700"
                        : campaign.status === "paused"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {campaign.status}
                  </span>

                  {campaign.status === "published" ? (
                    <button
                      onClick={() =>
                        updateCampaignStatus(campaign.id, "paused")
                      }
                      className="rounded-lg border border-yellow-300 px-3 py-1.5 text-xs font-semibold text-yellow-700 hover:bg-yellow-50"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        updateCampaignStatus(campaign.id, "published")
                      }
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
