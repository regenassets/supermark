import Link from "next/link";

import { CheckIcon, GithubIcon, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomepagePricing() {
  const selfHostedFeatures = [
    "Unlimited users and documents",
    "All features included",
    "No recurring costs",
    "Complete control of your data",
  ];

  const sponsoredFeatures = [
    "Unlimited users and documents",
    "All features included",
    "Managed infrastructure",
    "99.9% uptime SLA",
  ];

  const startupFeatures = [
    "Unlimited users and documents",
    "All features included",
    "Managed infrastructure",
    "99.9% uptime SLA",
    "Storage limits apply",
    "BYO AI Provider",
  ];

  const enterpriseFeatures = [
    "Unlimited users and documents",
    "All features included",
    "Managed infrastructure",
    "99.9% uptime SLA",
    "Storage limits apply",
    "BYO AI Provider",
  ];

  return (
    <section id="pricing" className="container py-12 md:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            One-time fee per company, for the lifetime of your company.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Self-Hosted Option */}
          <Card className="flex flex-col border-border hover:border-muted-foreground/50 transition-all">
            <CardHeader>
              <CardTitle>Self-Hosted</CardTitle>
              <CardDescription>
                Deploy on your own infrastructure
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Free</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-6 flex-1 space-y-2">
                {selfHostedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF] dark:text-[#3D8BFF]" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="https://github.com/regenassets/supermark"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" className="w-full gap-2">
                  <GithubIcon className="h-4 w-4" />
                  View on GitHub
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Sponsored Option */}
          <Card className="flex flex-col border-border hover:border-muted-foreground/50 transition-all">
            <CardHeader>
              <CardTitle>Sponsored</CardTitle>
              <CardDescription>
                For non-profits, charities, and commons builders
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Free</span>
                <span className="text-muted-foreground"> / lifetime</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-6 flex-1 space-y-2">
                {sponsoredFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF] dark:text-[#3D8BFF]" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/sponsorship">
                <Button variant="outline" className="w-full gap-2">
                  Request Sponsorship
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Startup Option */}
          <Card className="flex flex-col border-[#0066FF] dark:border-[#3D8BFF] shadow-lg relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF] dark:bg-[#3D8BFF] px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3 w-3" />
                Popular
              </span>
            </div>
            <CardHeader>
              <CardTitle>Startup</CardTitle>
              <CardDescription>For early-stage teams</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-muted-foreground"> / lifetime</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-6 flex-1 space-y-2">
                {startupFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF] dark:text-[#3D8BFF]" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full gap-2 bg-[#0066FF] hover:bg-[#0052CC] dark:bg-[#3D8BFF] dark:hover:bg-[#5CA3FF]">
                  Get Started
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise Option */}
          <Card className="flex flex-col border-border hover:border-muted-foreground/50 transition-all">
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>For established companies</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$2,499</span>
                <span className="text-muted-foreground"> / lifetime</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="mb-6 flex-1 space-y-2">
                {enterpriseFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#0066FF] dark:text-[#3D8BFF]" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full gap-2">Get Started</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
