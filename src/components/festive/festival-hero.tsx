"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import {
  showFallbackImage,
  type FestiveProduct,
  type FestivalCampaign,
} from "./campaign-utils";
import { FestivalArtwork, FestivalOrnaments } from "./festival-decorations";
import { themeBackground, type FestivalTheme } from "./festival-themes";

type FestivalHeroProps = {
  campaign: FestivalCampaign;
  products: FestiveProduct[];
  theme: FestivalTheme;
  maxDiscount: number;
  ctaHref: string;
  ctaLabel?: string;
  headingLevel?: "h1" | "h2";
};

function useTimeLeft(endDate?: string | null) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!endDate) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [endDate]);

  if (!endDate || now === null) return null;

  const end = new Date(endDate).getTime();
  if (!Number.isFinite(end)) return null;

  const diff = end - now;
  if (diff <= 0) return null;

  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);

  if (days > 30) return null;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${Math.max(minutes, 1)}m`;
}

export function FestivalHero({
  campaign,
  products,
  theme,
  maxDiscount,
  ctaHref,
  ctaLabel,
  headingLevel = "h2",
}: FestivalHeroProps) {
  const Heading = headingLevel;
  const timeLeft = useTimeLeft(campaign.end_date);
  const showcase = products.filter((product) => product.image).slice(0, 3);
  const heading = campaign.heading || campaign.campaign_name;
  const showCampaignName =
    campaign.campaign_name && campaign.campaign_name !== heading;

  return (
    <div
      className="relative isolate overflow-hidden rounded-3xl shadow-[0_18px_50px_-20px_rgba(0,0,0,0.45)] sm:rounded-[2rem]"
      style={{ background: themeBackground(theme, campaign.background_color) }}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" style={{ background: theme.pattern }} />
      <FestivalOrnaments theme={theme} />

      <div className="relative grid items-center gap-4 px-5 pb-6 pt-10 sm:px-8 sm:pb-8 sm:pt-12 md:grid-cols-[1.1fr_1fr] md:gap-6 lg:px-12 lg:py-14">
        <div className="relative z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] sm:text-[11px]"
              style={{ background: "rgba(255,255,255,0.16)", color: theme.ink, boxShadow: `inset 0 0 0 1px ${theme.accent}66` }}
            >
              <Sparkles size={12} style={{ color: theme.accent }} />
              {campaign.festival_name}
            </span>
            {timeLeft ? (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px]"
                style={{ background: theme.accent, color: theme.accentInk }}
              >
                <Clock size={12} />
                Ends in {timeLeft}
              </span>
            ) : null}
          </div>

          <p
            className="mt-3 font-serif text-sm italic sm:text-base"
            style={{ color: theme.inkMuted }}
          >
            {theme.label}
          </p>

          <Heading
            className="mt-1 text-[28px] font-black leading-[1.05] tracking-tight sm:text-4xl lg:text-[52px]"
            style={{ color: theme.ink }}
          >
            {heading}
          </Heading>

          {showCampaignName ? (
            <p
              className="mt-2 text-xs font-bold uppercase tracking-[0.2em] sm:text-sm"
              style={{ color: theme.accent }}
            >
              {campaign.campaign_name}
            </p>
          ) : null}

          {campaign.subtitle ? (
            <p
              className="mx-auto mt-3 max-w-md text-sm leading-relaxed sm:text-base md:mx-0"
              style={{ color: theme.inkMuted }}
            >
              {campaign.subtitle}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <Link
              href={ctaHref}
              className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-extrabold uppercase tracking-wide shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] sm:text-[15px]"
              style={{ background: theme.accent, color: theme.accentInk }}
            >
              {ctaLabel || campaign.button_text || "Shop Now"}
              <ArrowRight size={18} />
            </Link>
            <span className="text-xs font-semibold sm:text-sm" style={{ color: theme.inkMuted }}>
              {products.length} festive {products.length === 1 ? "pick" : "picks"} · {theme.tagline}
            </span>
          </div>
        </div>

        <div className="relative mx-auto flex h-[190px] w-full max-w-[420px] items-center justify-center sm:h-[250px] lg:h-[300px]">
          <FestivalArtwork
            theme={theme}
            className="festive-float absolute inset-0 h-full w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
          />

          {showcase.map((product, index) => {
            const positions = [
              "left-[4%] bottom-[2%] h-[44%] -rotate-6",
              "right-[4%] bottom-[8%] h-[50%] rotate-6",
              "left-1/2 top-[2%] h-[38%] -translate-x-1/2 rotate-2",
            ];
            return (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className={`absolute aspect-square overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl transition hover:z-10 hover:scale-105 ${positions[index]}`}
                aria-label={product.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.name}
                  width={240}
                  height={240}
                  decoding="async"
                  onError={showFallbackImage}
                  className="h-full w-full object-cover"
                />
              </Link>
            );
          })}

          {maxDiscount > 0 ? (
            <div
              className="absolute -top-2 right-0 z-20 grid h-[88px] w-[88px] rotate-12 place-items-center rounded-full text-center shadow-2xl sm:-top-4 sm:h-[112px] sm:w-[112px]"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${theme.highlight}, ${theme.accent})`,
                color: theme.accentInk,
                boxShadow: `0 0 0 4px rgba(255,255,255,0.85), 0 14px 30px rgba(0,0,0,0.35)`,
              }}
            >
              <div className="leading-none">
                <span className="block text-[9px] font-extrabold uppercase tracking-widest sm:text-[11px]">
                  Up to
                </span>
                <span className="block text-[28px] font-black sm:text-[36px]">
                  {maxDiscount}%
                </span>
                <span className="block text-[9px] font-extrabold uppercase tracking-widest sm:text-[11px]">
                  Festive Off
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
