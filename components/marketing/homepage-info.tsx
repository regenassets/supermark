import Link from "next/link";

import { CheckIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomepageInfo() {
  const features = [
    "Unlimited team members",
    "Unlimited documents",
    "Unlimited data rooms",
    "Custom branding (logo, colors, welcome message)",
    "Custom domains",
    "Advanced link controls (expiration, passwords, emails)",
    "NDA agreements and e-signatures",
    "Document analytics and visitor tracking",
    "Webhooks and API access",
    "Custom fields and tags",
    "Link presets",
    "Self-hosted deployment",
    "Full data ownership",
    "No vendor lock-in (AGPL-3.0 licensed)",
  ];

  return (
    <section className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-[64rem]">
        <Card className="bg-transparent">
          <CardHeader>
            <CardTitle className="text-2xl">All Features Included</CardTitle>
            <CardDescription>
              Every feature available with no per-user or per-document charges
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Questions? Visit our GitHub repository or join the community
                discussions.
              </p>
              <Link
                href="https://github.com/regenassets/supermark"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                GitHub Repository →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
