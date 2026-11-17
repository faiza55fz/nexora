import Link from "next/link";
import { categories } from "@/lib/data";
import type { FestiveProduct } from "./campaign-utils";
import type { FestivalTheme } from "./festival-themes";

const CATEGORY_IMAGES: Record<string, string> = {
  fruits: "/images/home/fruits-banner.jpg",
  vegetables: "/images/home/vegetables-banner.jpg",
  dairy: "/images/home/dairy.jpg",
  staples: "/images/home/staples.jpg",
  pulses: "/images/home/pulses.jpg",
  spices: "/images/home/spices.jpg",
  snacks: "/images/home/snacks.jpg",
  beverages: "/images/home/beverages.jpg",
  household: "/images/home/household.jpg",
};

type FestiveCategoryTilesProps = {
  theme: FestivalTheme;
  products: FestiveProduct[];
  festivalName: string;
};

export function FestiveCategoryTiles({
  theme,
  products,
  festivalName,
}: FestiveCategoryTilesProps) {
  const offerCounts = products.reduce<Record<string, number>>((counts, product) => {
    if (product.categorySlug) {
      counts[product.categorySlug] = (counts[product.categorySlug] ?? 0) + 1;
    }
    return counts;
  }, {});

  const tiles = [...categories].sort(
    (a, b) => (offerCounts[b.slug] ?? 0) - (offerCounts[a.slug] ?? 0),
  );

  return (
    <section className="pt-6 sm:pt-8">
      <div className="mb-3 sm:mb-4">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.16em] sm:text-xs"
          style={{ color: theme.pageAccent }}
        >
          Shop the {festivalName} store
        </span>
        <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-ink sm:text-2xl">
          Festive Shopping by Category
        </h2>
      </div>

      <div className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-9 [&::-webkit-scrollbar]:hidden">
        {tiles.map((category) => {
          const count = offerCounts[category.slug] ?? 0;
          return (
            <Link
              key={category.slug}
              href={`/products?category=${category.slug}`}
              className="group flex w-[86px] shrink-0 snap-start flex-col items-center text-center sm:w-auto"
            >
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 p-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-md"
                style={{ borderColor: count > 0 ? theme.accent : theme.softBorder, background: theme.soft }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={CATEGORY_IMAGES[category.slug] ?? CATEGORY_IMAGES.staples}
                  alt={category.name}
                  width={160}
                  height={160}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {count > 0 ? (
                  <span
                    className="absolute inset-x-1 bottom-1 rounded-b-xl py-0.5 text-[9px] font-extrabold uppercase tracking-wide sm:text-[10px]"
                    style={{ background: theme.accent, color: theme.accentInk }}
                  >
                    {count} {count === 1 ? "offer" : "offers"}
                  </span>
                ) : null}
              </div>
              <span className="mt-1.5 line-clamp-2 text-[11px] font-semibold leading-tight text-ink group-hover:text-brand sm:text-xs">
                {category.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
