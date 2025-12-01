import { CheckIcon, GithubIcon, ServerIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomepageSecurity() {
  const selfHostedFeatures = [
    "Your infrastructure, your rules",
    "Complete data sovereignty",
    "AGPL-3.0 licensed source code",
    "Deploy anywhere (AWS, GCP, on-prem)",
  ];

  const hostedFeatures = [
    "Managed security and updates",
    "Zero infrastructure overhead",
    "99.9% uptime SLA",
    "Dedicated support team",
  ];

  return (
    <section className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-[64rem]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Security Through Ownership
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Choose the deployment model that fits your security requirements.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Self-Host Option */}
          <Card className="bg-transparent">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ServerIcon className="h-6 w-6" />
              </div>
              <CardTitle>Self-Host</CardTitle>
              <CardDescription>
                Deploy on your own infrastructure with complete control over
                security and data governance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2">
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

          {/* Hosted Option */}
          <Card className="bg-transparent">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <CardTitle>Hosted</CardTitle>
              <CardDescription>
                Let us handle the infrastructure while you focus on your
                documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="mb-6 space-y-2">
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
