import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/providers";
import { SiteShell } from "@/components/site-shell";

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
<html
lang="en"
className={`${jakarta.variable} h-full antialiased`}
> 
  <body className="min-h-full bg-bg font-sans text-ink">
    <AppProvider> 
      <SiteShell>{children}</SiteShell> 
    </AppProvider> 
  </body> 
</html>
);
}
