"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Mode } from "@/lib/types";
import { supabase } from "@/lib/supabase";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "vendor" | "admin";
  businessName?: string;
  city?: string;
  vendorStatus?: "not-registered" | "pending" | "approved";
};

export type ExistingOrderItem = {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  quantity: number;
  maxQuantity: number;
};

type Store = {
  user: AppUser | null;
  authReady: boolean;
  login: (user: AppUser) => void;
  logout: () => void;

  mode: Mode;
  setMode: (m: Mode) => void;

  theme: "light" | "dark";
  toggleTheme: () => void;

  cart: CartItem[];
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  existingOrderItems: ExistingOrderItem[];
  addToExistingOrder: (item: ExistingOrderItem) => void;
  setExistingOrderQty: (variantId: string, qty: number) => void;
  removeFromExistingOrder: (variantId: string) => void;
  clearExistingOrderItems: () => void;

  wishlist: string[];
  toggleWishlist: (productId: string) => void;

  compare: string[];
  toggleCompare: (productId: string) => void;

  notifications: {
    id: string;
    title: string;
    body: string;
    time: string;
  }[];
};

const Ctx = createContext<Store | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<Mode>("b2c");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [authReady, setAuthReady] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);

  const [existingOrderItems, setExistingOrderItems] = useState<
    ExistingOrderItem[]
  >([]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const clearExistingOrderItems = useCallback(() => {
    setExistingOrderItems([]);
  }, []);

  const addToExistingOrder = useCallback(
    (item: ExistingOrderItem) => {
      setExistingOrderItems((prev) => {
        const found = prev.find(
          (existing) => existing.variantId === item.variantId,
        );

        if (found) {
          return prev.map((existing) =>
            existing.variantId === item.variantId
              ? {
                  ...existing,
                  quantity: Math.min(
                    existing.quantity + item.quantity,
                    existing.maxQuantity,
                  ),
                }
              : existing,
          );
        }

        return [...prev, item];
      });
    },
    [],
  );

  const setExistingOrderQty = useCallback(
    (variantId: string, qty: number) => {
      setExistingOrderItems((prev) =>
        qty <= 0
          ? prev.filter(
              (item) => item.variantId !== variantId,
            )
          : prev.map((item) =>
              item.variantId === variantId
                ? {
                    ...item,
                    quantity: Math.min(
                      qty,
                      item.maxQuantity,
                    ),
                  }
                : item,
            ),
      );
    },
    [],
  );

  const removeFromExistingOrder = useCallback(
    (variantId: string) => {
      setExistingOrderItems((prev) =>
        prev.filter(
          (item) => item.variantId !== variantId,
        ),
      );
    },
    [],
  );

  const [wishlist, setWishlist] = useState<string[]>([
    "p3",
    "p2",
  ]);

  const [compare, setCompare] = useState<string[]>([
    "p1",
  ]);

  const [hydrated, setHydrated] = useState(false);

  // Load the customer profile for a Supabase auth session
  const loadUserFromSession = useCallback(
    async (
      session: {
        user: {
          id: string;
          email?: string;
          user_metadata?: {
            name?: string;
            phone?: string;
          };
        };
      } | null,
    ) => {
      if (!session?.user) {
        setUser(null);
        localStorage.removeItem("nexora-user");
        return;
      }

      const authUser = session.user;

      const { data: customer } = await supabase
        .from("customers")
        .select("name, email, phone")
        .eq("id", authUser.id)
        .maybeSingle();

      const nextUser: AppUser = {
        id: authUser.id,
        name:
          customer?.name ||
          authUser.user_metadata?.name ||
          "Nexora Customer",
        email:
          customer?.email ||
          authUser.email ||
          "",
        phone:
          customer?.phone ||
          authUser.user_metadata?.phone ||
          "",
        role: "customer",
      };

      setUser(nextUser);

      localStorage.setItem(
        "nexora-user",
        JSON.stringify(nextUser),
      );
    },
    [],
  );

  // Restore authentication exactly once when the app starts.
  // Auth state changes are handled only after this initial restore finishes.
  useEffect(() => {
    let mounted = true;
    let initialized = false;

    async function restoreSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session) {
          // IMPORTANT:
          // Wait for the customer profile to load BEFORE
          // telling the rest of the app that auth is ready.
          await loadUserFromSession(session);
        } else {
          setUser(null);
          localStorage.removeItem("nexora-user");
        }

        if (!mounted) return;

        initialized = true;
        setAuthReady(true);
      } catch {
        if (!mounted) return;

        setUser(null);
        initialized = true;
        setAuthReady(true);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        // Ignore auth events during the initial startup.
        // getSession() above is responsible for the first restore.
        if (!initialized) return;

        if (!session) {
          setUser(null);
          localStorage.removeItem("nexora-user");
          return;
        }

        void loadUserFromSession(session);
      },
    );

    void restoreSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserFromSession]);

  const login = useCallback((nextUser: AppUser) => {
    setUser(nextUser);

    localStorage.setItem(
      "nexora-user",
      JSON.stringify(nextUser),
    );
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("nexora-user");
    void supabase.auth.signOut();
  }, []);

  // Load cart from localStorage once when the app starts
  useEffect(() => {
    const savedCart = localStorage.getItem("nexora-cart");

    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);

        if (Array.isArray(parsedCart)) {
          setCart(parsedCart);
        }
      } catch {
        localStorage.removeItem("nexora-cart");
      }
    }

    setCartHydrated(true);
  }, []);

  // Save cart only after the initial cart has been loaded
  useEffect(() => {
    if (!cartHydrated) return;

    localStorage.setItem(
      "nexora-cart",
      JSON.stringify(cart),
    );
  }, [cart, cartHydrated]);

  useEffect(() => {
    const saved = localStorage.getItem(
      "nexora-theme",
    ) as "light" | "dark" | null;

    const initial =
      saved ??
      (window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches
        ? "dark"
        : "light");

    setTheme(initial);

    document.documentElement.classList.toggle(
      "dark",
      initial === "dark",
    );

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );

    localStorage.setItem(
      "nexora-theme",
      theme,
    );
  }, [theme, hydrated]);

  const toggleTheme = useCallback(() => {
    setTheme((t) =>
      t === "dark" ? "light" : "dark",
    );
  }, []);

  const addToCart = useCallback(
    (productId: string, qty = 1) => {
      setCart((prev) => {
        const found = prev.find(
          (i) => i.productId === productId,
        );

        if (found) {
          return prev.map((i) =>
            i.productId === productId
              ? { ...i, qty: i.qty + qty }
              : i,
          );
        }

        return [
          ...prev,
          {
            productId,
            qty,
          },
        ];
      });
    },
    [],
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setCart((prev) =>
        qty <= 0
          ? prev.filter(
              (i) => i.productId !== productId,
            )
          : prev.map((i) =>
              i.productId === productId
                ? {
                    ...i,
                    qty,
                  }
                : i,
            ),
      );
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCart((prev) =>
        prev.filter(
          (i) => i.productId !== productId,
        ),
      );
    },
    [],
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) =>
        prev.includes(productId)
          ? prev.filter(
              (id) => id !== productId,
            )
          : [...prev, productId],
      );
    },
    [],
  );

  const toggleCompare = useCallback(
    (productId: string) => {
      setCompare((prev) => {
        if (prev.includes(productId)) {
          return prev.filter(
            (id) => id !== productId,
          );
        }

        if (prev.length >= 3) {
          return [
            ...prev.slice(1),
            productId,
          ];
        }

        return [
          ...prev,
          productId,
        ];
      });
    },
    [],
  );

  // Check pending stock-notification requests for the logged-in customer
  useEffect(() => {
    if (!user?.id) return;

    const customerId = user.id;
    let cancelled = false;

    async function checkStockNotifications() {
      try {
        const {
          data: requests,
          error,
        } = await supabase
          .from(
            "product_stock_notifications",
          )
          .select("id, product_id")
          .eq(
            "customer_id",
            customerId,
          )
          .is(
            "notified_at",
            null,
          );

        console.log(
          "🔔 Stock notification check",
          {
            customerId,
            requests,
            error,
          },
        );

        if (
          error ||
          !requests?.length ||
          cancelled
        ) {
          return;
        }

        for (const request of requests) {
          const {
            data: product,
          } = await supabase
            .from("products")
            .select(
              "id, name, active",
            )
            .eq(
              "id",
              request.product_id,
            )
            .maybeSingle();

          console.log(
            "🔔 Product check",
            {
              request,
              product,
            },
          );

          if (
            !product ||
            !product.active ||
            cancelled
          ) {
            continue;
          }

          const {
            data: variant,
          } = await supabase
            .from("product_variants")
            .select("id")
            .eq(
              "product_id",
              product.id,
            )
            .eq(
              "active",
              true,
            )
            .limit(1)
            .maybeSingle();

          if (!variant || cancelled) {
            continue;
          }

          const {
            data: inventory,
          } = await supabase
            .from("inventory")
            .select(
              "stock_quantity",
            )
            .eq(
              "variant_id",
              variant.id,
            )
            .maybeSingle();

          if (
            !inventory ||
            inventory.stock_quantity <=
              0 ||
            cancelled
          ) {
            continue;
          }

          await supabase
            .from(
              "product_stock_notifications",
            )
            .update({
              notified_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              request.id,
            )
            .eq(
              "customer_id",
              customerId,
            );

          if (cancelled) return;

          if (
            typeof window !==
              "undefined" &&
            "Notification" in
              window &&
            Notification.permission ===
              "granted"
          ) {
            new Notification(
              "Nexora — Back in stock",
              {
                body: `${product.name} is available again.`,
              },
            );
          }

          window.dispatchEvent(
            new CustomEvent(
              "nexora-stock-notification",
              {
                detail: {
                  productId:
                    product.id,
                  productName:
                    product.name,
                },
              },
            ),
          );
        }
      } catch (error) {
        console.error(
          "Stock notification check failed:",
          error,
        );
      }
    }

    void checkStockNotifications();

    const interval =
      window.setInterval(
        checkStockNotifications,
        30000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval,
      );
    };
  }, [user?.id]);

  const notifications = useMemo(
    () => [
      {
        id: "n1",
        title: "Order shipped",
        body: "NXR-1024 is ready for delivery.",
        time: "2h",
      },
      {
        id: "n2",
        title: "RFQ quote",
        body: "Fresh Basket Farm has a new order to prepare.",
        time: "5h",
      },
      {
        id: "n3",
        title: "Fresh deal",
        body: "Fresh bananas are on offer today.",
        time: "1d",
      },
    ],
    [],
  );

  const value = useMemo(
    () => ({
      user,
      authReady,
      login,
      logout,
      mode,
      setMode,
      theme,
      toggleTheme,

      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,

      existingOrderItems,
      addToExistingOrder,
      setExistingOrderQty,
      removeFromExistingOrder,
      clearExistingOrderItems,

      wishlist,
      toggleWishlist,

      compare,
      toggleCompare,

      notifications,
    }),
    [
      user,
      authReady,
      login,
      logout,
      mode,
      theme,
      toggleTheme,

      cart,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,

      existingOrderItems,
      addToExistingOrder,
      setExistingOrderQty,
      removeFromExistingOrder,
      clearExistingOrderItems,

      wishlist,
      toggleWishlist,

      compare,
      toggleCompare,

      notifications,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(Ctx);

  if (!ctx) {
    throw new Error(
      "useStore must be used within AppProvider",
    );
  }

  return ctx;
}