import { notFound } from "next/navigation";

// Explicitly return 404 for legacy /hotZones route so it's effectively removed.
export default function Page() {
  notFound();
}
