import { Suspense } from "react";
import ListingClient from "./listing-client";

export default function ListingPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading catalog…</div>}>
      <ListingClient />
    </Suspense>
  );
}
