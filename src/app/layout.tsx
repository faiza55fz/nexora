import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers";
import { BottomNav, Footer, Header } from "@/components/storefront-chrome";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Nexora — Shop, wholesale & sell across India",
  description:
    "A unified Indian marketplace for customers, B2B buyers, sellers and admins. GST invoices, UPI and Net terms.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full bg-bg font-sans text-ink">
        <AppProvider>
          <Header />
          <main className="pb-20 md:pb-0">{children}</main>
          <Footer />
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
