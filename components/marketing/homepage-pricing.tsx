import Link from "next/link";

import { CheckIcon, GithubIcon } from "lucide-react";

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

  const hostedFeatures = [
    "Unlimited users and documents",
    "All features included",
    "Managed infrastructure",
    "99.9% uptime SLA",
  ];

  return (
    <section className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-[64rem]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            One-time fee per company, for the lifetime of your company.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Self-Hosted Option */}
          <Card className="flex flex-col bg-transparent">
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
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
          <Card className="flex flex-col bg-transparent">
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
                {hostedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button variant="outline" className="w-full gap-2">
                  Request Sponsorship
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Startup Option */}
          <Card className="flex flex-col border-primary bg-transparent">
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
                {hostedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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

          {/* Enterprise Option */}
          <Card className="flex flex-col bg-transparent">
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
                {hostedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
