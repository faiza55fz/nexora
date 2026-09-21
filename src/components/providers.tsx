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

type Store = {
  user: AppUser | null;
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const [wishlist, setWishlist] = useState<string[]>(["p3", "p2"]);
  const [compare, setCompare] = useState<string[]>(["p1"]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("nexora-user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("nexora-user");
      }
    }

    const saved = localStorage.getItem("nexora-theme") as
      | "light"
      | "dark"
      | null;

    const initial =
      saved ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");

    setTheme(initial);
    document.documentElement.classList.toggle(
      "dark",
      initial === "dark",
    );

    setHydrated(true);
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
    if (!hydrated) return;

    document.documentElement.classList.toggle(
      "dark",
      theme === "dark",
    );

    localStorage.setItem("nexora-theme", theme);
  }, [theme, hydrated]);

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
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
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

        return [...prev, { productId, qty }];
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
                ? { ...i, qty }
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
          ? prev.filter((id) => id !== productId)
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
          return [...prev.slice(1), productId];
        }

        return [...prev, productId];
      });
    },
    [],
  );

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
      wishlist,
      toggleWishlist,
      compare,
      toggleCompare,
      notifications,
    }),
    [
      user,
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