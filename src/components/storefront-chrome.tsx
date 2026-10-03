"use client";

import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import {useEffect,useRef, useState } from "react";
import NotificationBell from "@/components/notification-bell";
import {
  Bell,
  ChevronDown,
  Heart,
  MapPin,
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { useStore } from "@/components/providers";
import { categories, products } from "@/lib/data";
import { Badge } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export function Header() {
  const {
    theme,
    toggleTheme,
    cart,
    wishlist,
    notifications,
    compare,
    user,
  } = useStore();

  const [q, setQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [cats, setCats] = useState(false);
  const [notes, setNotes] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<{
    label: string;
    city: string;
    address_line1: string;
  } | null>(null);
  const [stockPopup, setStockPopup] = useState<{
    productName: string;
     productId: string;
  } | null>(null);

  useEffect(() => {
    async function loadDefaultAddress() {
      if (!user) {
        setDefaultAddress(null);
        return;
      }

      const { data, error } = await supabase
        .from("customer_addresses")
        .select("label, city, address_line1")
        .eq("customer_id", user.id)
        .eq("is_default", true)
        .maybeSingle();

      if (error) {
        console.error(
          "Failed to load default address:",
          error,
        );
        setDefaultAddress(null);
        return;
      }

      setDefaultAddress(data);
    }

    loadDefaultAddress();
  }, [user]);

  useEffect(() => {
    function handleStockNotification(event: Event) {
      const customEvent = event as CustomEvent<{
        productName: string;
        productId: string;
      }>;

      if (!customEvent.detail?.productName) return;

           if (!customEvent.detail?.productId) return;

      setStockPopup({
        productId: customEvent.detail.productId,
        productName: customEvent.detail.productName,
      }); 

      setNotes(true);

      window.setTimeout(() => {
        setStockPopup(null);
      }, 6000);
    }

    window.addEventListener(
      "nexora-stock-notification",
      handleStockNotification,
    );

    return () => {
      window.removeEventListener(
        "nexora-stock-notification",
        handleStockNotification,
      );
    };
  }, []);

  useEffect(() => {
  try {
    const saved = localStorage.getItem("sundayshop-search-history");

    if (saved) {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        console.log("Search history loaded:", parsed);
        setSearchHistory(
          parsed.filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          ),
        );
      }
    }
  } catch (error) {
    console.error("Failed to load search history:", error);
  }
}, []);
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (
      searchRef.current &&
      !searchRef.current.contains(event.target as Node)
    ) {
      setSearchFocused(false);
    }
  }

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);
  const router = useRouter();
  const searchParams = useSearchParams();
const addToOrderId = searchParams.get("addToOrder");

const cartHref = addToOrderId
  ? `/cart?addToOrder=${encodeURIComponent(addToOrderId)}`
  : "/cart";

  const suggestions = products
    .filter((p) =>
      q.length > 1
        ? p.name.toLowerCase().includes(q.toLowerCase())
        : false,
    )
    .slice(0, 4);

  const cartCount = cart.reduce((n, i) => n + i.qty, 0);

 function submitSearch(e: React.FormEvent<HTMLFormElement>) {
   console.log("SEARCH SUBMITTED", q);
  e.preventDefault();

  const term = q.trim();

  if (!term) {
    setSearchFocused(false);
    router.push("/products");
    return;
  }

  const updatedHistory = [
    term,
    ...searchHistory.filter(
      (item) => item.toLowerCase() !== term.toLowerCase(),
    ),
  ].slice(0, 10);

  setSearchHistory(updatedHistory);

  try {
    localStorage.setItem(
      "sundayshop-search-history",
      JSON.stringify(updatedHistory),
    );
  } catch (error) {
    console.error("Failed to save search history:", error);
  }

  setSearchFocused(false);
window.location.href = `/products?q=${encodeURIComponent(term)}`;
 
}

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90">
      {/* Top promise bar */}
      <div className="bg-brand text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 text-xs sm:justify-between">
          <p className="font-medium">
            Fresh groceries • Low prices • Delivered within a day
          </p>

          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/track/NXR-240918-1842"
              className="text-white/80 transition hover:text-white"
            >
              Track order
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex min-h-[68px] items-center gap-3">
          {/* Mobile menu */}
          <button
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl hover:bg-surface-2 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-lg font-bold text-white shadow-sm">
              S
            </span>

            <span className="hidden text-xl font-bold tracking-tight sm:block">
              SundayShop
            </span>
          </Link>

          {/* Delivery location */}
          <button 
          type="button"
          onClick={() => router.push("/account/addresses")}
          className="hidden items-center gap-2 rounded-xl px-3 py-2 text-left transition hover:bg-surface-2 lg:flex">
            <MapPin size={18} className="text-brand" />

            <div className="leading-tight">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
               Deliver to
               </p>

              <p className="max-w-28 truncate text-xs font-semibold">
                {defaultAddress
                    ? `${defaultAddress.label} · ${defaultAddress.city}`
                    : "Add address"}
              </p>
            </div>

            <ChevronDown size={14} className="text-muted" />
          </button>

          {/* Categories */}
          <div className="relative hidden lg:block">
            <button
              className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition hover:bg-surface-2"
              onClick={() => setCats((v) => !v)}
            >
              Categories
              <ChevronDown
                size={15}
                className={cats ? "rotate-180 transition" : "transition"}
              />
            </button>
          </div>

          {/* Search */}
          <form
            ref={searchRef}
            className="relative z-50 ml-auto hidden flex-1 md:block"
            onSubmit={submitSearch}
          >
            <Search
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              size={18}
            />

            <input
            
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                 setSearchFocused(true);
                 }}
                
                onClick={() => {
    
    setSearchFocused(true);

    if (searchHistory.length > 0) {
      setQ("");
    }
  }}
              placeholder="Search fruits, vegetables, groceries..."
              className="h-11 w-full rounded-xl border border-line bg-bg pl-11 pr-28 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10"
              aria-label="Search fruits, vegetables and groceries"
            />

            <span className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-lg bg-ai-soft px-2 py-1 text-[11px] font-semibold text-ai lg:inline-flex">
              <Sparkles size={12} />
              Smart search
            </span>

   {searchFocused && searchHistory.length > 0 && (
  <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow)]">

    {q.trim().length === 0 && searchHistory.length > 0 && (
      <div className="p-2">
        <div className="flex items-center justify-between px-2 py-2">
          <p className="text-xs font-semibold text-muted">
            Recent searches
          </p>

          <button
            type="button"
            className="text-xs font-semibold text-brand hover:underline"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setSearchHistory([]);

              try {
                localStorage.removeItem(
                  "sundayshop-search-history",
                );
              } catch (error) {
                console.error(
                  "Failed to clear search history:",
                  error,
                );
              }
            }}
          >
            Clear
          </button>
        </div>

        {searchHistory.map((term) => (
          <button
            key={term}
            type="button"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-surface-2"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setQ(term);
              setSearchFocused(false);
              router.push(
                `/products?q=${encodeURIComponent(term)}`,
              );
            }}
          >
            <Search
              size={15}
              className="shrink-0 text-muted"
            />

            <span className="truncate">
              {term}
            </span>
          </button>
        ))}
      </div>
    )}

    {q.trim().length > 0 && suggestions.length > 0 && (
      <div className="p-1">
        {suggestions.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.id}`}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-surface-2"
            onClick={() => {
              setQ("");
              setSearchFocused(false);
            }}
          >
            <Search size={15} className="text-muted" />
            <span>{product.name}</span>
          </Link>
        ))}
      </div>
    )}
  </div>
)}
          </form>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-0.5 md:ml-2">
            
            

            {/* Wishlist */}
            <Link
              href="/account/wishlist"
              className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-surface-2"
              aria-label="Wishlist"
            >
              <Heart size={19} />

              {wishlist.length > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[10px] font-bold text-white">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Notifications */}
           {/* Notifications */}
{user && (
  <NotificationBell
    recipientId={user.id}
    recipientType="customer"
  />
)}

            {/* Cart */}
            <Link
              href={cartHref}
              className="relative grid h-10 w-10 place-items-center rounded-xl transition hover:bg-surface-2"
              aria-label="Shopping cart"
            >
              <ShoppingBag size={20} />

              {cartCount > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-cta px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            {user ? (
              <Link
                href="/account"
                className="ml-1 flex h-10 items-center gap-2 rounded-xl px-1.5 transition hover:bg-surface-2"
                aria-label="My account"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-soft text-brand">
                  <User size={17} />
                </span>

                <span className="hidden max-w-24 truncate text-sm font-semibold xl:block">
                  {user.name}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="ml-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile search */}
        <form
          className="pb-3 md:hidden"
          onSubmit={submitSearch}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              size={17}
            />

            <input
  value={q}
  onChange={(e) => setQ(e.target.value)}
  onFocus={() => {
    setSearchFocused(true);

    if (searchHistory.length > 0) {
      setQ("");
    }
  }}
  onClick={() => {
    setSearchFocused(true);

    if (searchHistory.length > 0) {
      setQ("");
    }
  }}
  
              placeholder="Search fruits, vegetables & groceries"
              className="h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
              aria-label="Search groceries"
            />
            {searchFocused && searchHistory.length > 0 && (
  <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-[var(--shadow)]">
    <div className="p-2">
      <div className="flex items-center justify-between px-2 py-2">
        <p className="text-xs font-semibold text-muted">
          Recent searches
        </p>

        <button
          type="button"
          className="text-xs font-semibold text-brand hover:underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setSearchHistory([]);

            try {
              localStorage.removeItem(
                "sundayshop-search-history",
              );
            } catch (error) {
              console.error(
                "Failed to clear search history:",
                error,
              );
            }
          }}
        >
          Clear
        </button>
      </div>

      {searchHistory.map((term) => (
        <button
          key={term}
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm hover:bg-surface-2"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setQ(term);
            setSearchFocused(false);
            router.push(
              `/products?q=${encodeURIComponent(term)}`,
            );
          }}
        >
          <Search
            size={15}
            className="shrink-0 text-muted"
          />

          <span className="truncate">
            {term}
          </span>
        </button>
      ))}
    </div>
  </div>
)}
          </div>
        </form>
      </div>

      {/* Categories dropdown */}
      {cats && (
        <div className="border-t border-line bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="rounded-xl border border-line bg-bg px-3 py-3 transition hover:border-brand/30 hover:bg-brand-soft"
                  onClick={() => setCats(false)}
                >
                  <span className="text-xl">{category.emoji}</span>
                  <p className="mt-1 text-sm font-semibold">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
<div
  className={`fixed inset-0 z-50 lg:hidden ${
    open ? "pointer-events-auto" : "pointer-events-none"
  }`}
>
  {/* Background overlay */}
  <div
    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${
      open ? "opacity-100" : "opacity-0"
    }`}
    onClick={() => setOpen(false)}
  />

  {/* Sliding drawer */}
  <aside
    className={`absolute left-0 top-0 h-full w-[min(82vw,340px)] overflow-y-auto bg-surface p-5 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
      open ? "translate-x-0" : "-translate-x-full"
    }`}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Header */}
    <div className="flex items-center justify-between border-b border-line pb-4">
      <Link
        href="/"
        className="flex items-center gap-2 transition-transform duration-200 hover:scale-[1.02]"
        onClick={() => setOpen(false)}
      >
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">
          N
        </span>

        <span className="font-bold">SundayShop</span>
      </Link>

      <button
        aria-label="Close menu"
        className="grid h-9 w-9 place-items-center rounded-xl transition-all duration-200 hover:bg-surface-2 hover:scale-105 active:scale-95"
        onClick={() => setOpen(false)}
      >
        <X size={20} />
      </button>
    </div>

    {/* Delivery */}
{/* Delivery */}
<button
  type="button"
  onClick={() => {
    setOpen(false);
    router.push("/account/addresses");
  }}
  className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-brand-soft p-4 text-left transition-transform duration-200 hover:scale-[1.01]"
>
  <MapPin size={20} className="text-brand" />

  <div className="min-w-0">
    <p className="text-xs text-muted">
      Deliver to
    </p>

    <p className="truncate text-sm font-semibold">
      {defaultAddress
        ? `${defaultAddress.label} · ${defaultAddress.city}`
        : "Add delivery address"}
    </p>

    {defaultAddress ? (
      <p className="mt-0.5 truncate text-xs text-muted">
        {defaultAddress.address_line1}
      </p>
    ) : null}
  </div>

  <ChevronDown
    size={16}
    className="ml-auto shrink-0 text-muted"
  />
</button>

    {/* Main navigation */}
    <div className="mt-5 space-y-1">
      <Link
        href="/products"
        onClick={() => setOpen(false)}
       className="block rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
        >🛒 Shop groceries
      </Link>

      <Link
        href="/deals"
        onClick={() => setOpen(false)}
        className="block rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
      >
        💰 Today's deals
      </Link>

      <Link
        href={cartHref}
        onClick={() => setOpen(false)}
        className="block rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
      >
        🛍️ Cart {cartCount > 0 ? `(${cartCount})` : ""}
      </Link>

      <Link
        href="/account/wishlist"
        onClick={() => setOpen(false)}
        className="block rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
      >
        ❤️ Wishlist
      </Link>

      <Link
        href="/account"
        onClick={() => setOpen(false)}
        className="block rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
      >
        👤 My account
      </Link>
    </div>

    {/* Contact SundayShop */}
    <div className="mt-6 border-t border-line pt-5">
      <p className="mb-3 px-3 font-semibold">Contact SundayShop</p>

      <a
        href="tel:+91XXXXXXXXXX"
        className="block rounded-xl px-3 py-3 text-sm text-muted transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 hover:text-foreground active:scale-[0.98]"
      >
        📞 Contact SundayShop
      </a>
    </div>

    {/* FAQs */}
    <div className="mt-5 border-t border-line pt-5">
      <p className="mb-3 px-3 font-semibold">FAQs</p>

      <Link
        href="/faq"
        onClick={() => setOpen(false)}
        className="block rounded-xl px-3 py-3 text-sm text-muted transition-all duration-200 hover:translate-x-1 hover:bg-surface-2 hover:text-foreground active:translate-x-1 active:scale-[0.98] active:bg-surface-2"
      >
        ❓ View FAQs & Help
      </Link>
    </div>

    {/* Why SundayShop */}
    <div className="mt-6 border-t border-line pt-5">
      <p className="mb-3 px-3 font-semibold">Why SundayShop?</p>

      <div className="space-y-1 text-sm text-muted">
        <div className="rounded-xl px-3 py-2 transition-transform duration-200 hover:translate-x-1">
          💰 Low prices
        </div>

        <div className="rounded-xl px-3 py-2 transition-transform duration-200 hover:translate-x-1">
          🥬 Fresh groceries
        </div>

        <div className="rounded-xl px-3 py-2 transition-transform duration-200 hover:translate-x-1">
          🚚 1-day delivery
        </div>

        <div className="rounded-xl px-3 py-2 transition-transform duration-200 hover:translate-x-1">
          💵 Cash on delivery
        </div>
      </div>
    </div>
  </aside>


              {/*{compare.length > 0 && (
                <Link
                  href="/compare"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-surface-2"
                >
                  ⚖️ Compare ({compare.length})
                </Link>
              )}*/}
            </div>

            {/* Temporary testing access 
            <div className="mt-6 border-t border-line pt-5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Testing
              </p>

              <Link
                href="/seller/register"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2"
              >
                Seller registration
              </Link>

              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface-2"
              >
                Admin console
              </Link>
            </div> */}
          
      {/* Compare bar */}
      
          {stockPopup && (
        <div
          className="fixed right-4 top-4 z-[100] w-[min(92vw,380px)] rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg">
              🛒
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                Back in stock 🎉
              </p>

              <p className="mt-1 text-sm text-muted">
                {stockPopup.productName} is available again.
              </p>

              <Link
                href={`/products/${encodeURIComponent(
                  stockPopup.productId,
                )}`}
                onClick={() => setStockPopup(null)}
                className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
              >
                Shop now
              </Link>
            </div>

            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setStockPopup(null)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand font-bold text-white">
              S
            </span>
            <p className="text-lg font-bold">SundayShop</p>
          </div>

          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            Fresh groceries, everyday essentials and better prices —
            delivered conveniently to your doorstep.
          </p>
        </div>

        {/* Shop */}
        <div>
          <p className="font-semibold">Shop</p>

          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link
                href="/products"
                className="hover:text-brand"
              >
                All groceries
              </Link>
            </li>
            <li>
              <Link
                href="/deals"
                className="hover:text-brand"
              >
                Today's deals
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=fruits"
                className="hover:text-brand"
              >
                Fruits
              </Link>
            </li>
            <li>
              <Link
                href="/products?category=vegetables"
                className="hover:text-brand"
              >
                Vegetables
              </Link>
            </li>
          </ul>
        </div>

        {/* Help */}
        <div>
          <p className="font-semibold">Help</p>

          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li>
              <Link href="/account/orders" className="hover:text-brand">
                My orders
              </Link>
            </li>
            <li>
              <Link href="/track/NXR-240918-1842" className="hover:text-brand">
                Track delivery
              </Link>
            </li>
            <li>
              <Link href="/account/returns" className="hover:text-brand">
                Returns
              </Link>
            </li>
            <a
          href="tel:+91XXXXXXXXXX"
         className="block py-2 text-sm text-muted hover:text-brand"
          > 
           Contact SundayShop
            </a>
            <li>
              <Link href="/account" className="hover:text-brand">
                My account
              </Link>
            </li>
          </ul>
        </div>

        {/* Promise */}
        <div>
          <p className="font-semibold">Why SundayShop?</p>

          <div className="mt-3 space-y-3 text-sm text-muted">
            <p>💰 Low prices</p>
            <p>🥬 Fresh groceries</p>
            <p>🚚 1-day delivery</p>
            <p>💵 Cash on delivery</p>
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-5 text-center text-xs text-muted">
          © 2026 SundayShop. Fresh groceries made simple.
        </div>
      </div>
    </footer>
  );
}

export function BottomNav() {
  const { cart } = useStore();
  const searchParams = useSearchParams();
  const addToOrderId = searchParams.get("addToOrder");

  const cartHref = addToOrderId
    ? `/cart?addToOrder=${encodeURIComponent(addToOrderId)}`
    : "/cart";

  const cartCount = cart.reduce((n, i) => n + i.qty, 0);

  const items = [
    { href: "/", label: "Home", icon: "⌂" },
    { href: "/products", label: "Shop", icon: "⌕" },
    { href: cartHref, label: "Cart", icon: "🛍" },
    { href: "/account", label: "Account", icon: "◯" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted transition hover:text-brand"
        >
          <span className="text-base leading-none">
            {item.icon}
          </span>
          <span>
            {item.label === "Cart" && cartCount > 0
              ? `Cart (${cartCount})`
              : item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
