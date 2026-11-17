"use client";

import { useMemo } from "react";
import {
  buildFestiveCollections,
  mapCampaignProducts,
  maxCampaignDiscount,
  type FestivalCampaign,
} from "./campaign-utils";
import { FestiveCarousel } from "./festive-carousel";
import { FestiveCategoryTiles } from "./festive-category-tiles";
import { FestivalHero } from "./festival-hero";
import { FestiveProductCard } from "./festive-product-card";
import { FestiveSection } from "./festive-section";
import { resolveFestivalTheme } from "./festival-themes";

export const FESTIVE_PRICE_NOTE =
  "Festive badges highlight this campaign's offers. Prices shown are current selling prices; your final amount is shown at checkout.";

const HOME_COLLECTION_LIMIT = 12;

export function FestiveShowcase({ campaign }: { campaign: FestivalCampaign }) {
  const theme = resolveFestivalTheme(campaign);
  const products = useMemo(() => mapCampaignProducts(campaign), [campaign]);
  const collections = useMemo(
    () => buildFestiveCollections(products, campaign.festival_name).slice(0, 2),
    [products, campaign.festival_name],
  );
  const campaignHref = `/festivals/${campaign.id}`;

  return (
    <section className="mx-auto max-w-7xl px-3 pt-6 sm:px-4 sm:pt-10">
      <FestivalHero
        campaign={campaign}
        products={products}
        theme={theme}
        maxDiscount={maxCampaignDiscount(products)}
        ctaHref={campaignHref}
      />

      {products.length > 0 ? (
        <div
          className="mt-4 rounded-3xl border px-3 pb-5 sm:px-6 sm:pb-7"
          style={{ background: theme.soft, borderColor: theme.softBorder }}
        >
          <FestiveCategoryTiles
            theme={theme}
            products={products}
            festivalName={campaign.festival_name}
          />

          {collections.map((collection) => (
            <FestiveSection
              key={collection.key}
              theme={theme}
              eyebrow={collection.eyebrow}
              title={collection.title}
              subtitle={collection.subtitle}
              viewAllHref={campaignHref}
            >
              <FestiveCarousel ariaLabel={collection.title}>
                {collection.products.slice(0, HOME_COLLECTION_LIMIT).map((product) => (
                  <FestiveProductCard key={product.id} product={product} theme={theme} />
                ))}
              </FestiveCarousel>
            </FestiveSection>
          ))}

          <p className="mt-3 text-[11px] text-muted">{FESTIVE_PRICE_NOTE}</p>
        </div>
      ) : null}
    </section>
  );
}
