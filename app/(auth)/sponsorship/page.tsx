import { Metadata } from "next";

import SponsorshipForm from "./page-client";

export const metadata: Metadata = {
  title: "Request Sponsorship | Supermark",
  description:
    "Request sponsored access to Supermark for your non-profit, charity, or commons project",
};

export default function SponsorshipPage() {
  return <SponsorshipForm />;
}
