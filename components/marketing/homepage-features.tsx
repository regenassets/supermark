import { DollarSignIcon, LockKeyholeIcon, RocketIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomepageFeatures() {
  const features = [
    {
      icon: LockKeyholeIcon,
      title: "Open Source & Self-Hosted",
      description:
        "Own your infrastructure, control your data, modify the code",
      benefits: [
        "AGPL-3.0 licensed - truly open",
        "No paygated features ever",
        "All features available to everyone",
      ],
    },
    {
      icon: RocketIcon,
      title: "Enterprise Features Included",
      description: "Professional document sharing without per-user pricing",
      benefits: ["Custom branding", "NDA agreements", "Advanced analytics"],
    },
    {
      icon: DollarSignIcon,
      title: "Value-Based Pricing",
      description: "Pay what makes sense for your organization",
      benefits: [
        "Unlimited users and documents",
        "Sliding scale based on organization type",
        "Free for self-hosted deployments",
      ],
    },
  ];

  return (
    <section className="container py-12 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-[64rem]">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Why Supermark?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Everything you need for professional document sharing and signing.
          </p>
        </div>
        <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border hover:border-muted-foreground/50 transition-all">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5 text-[#0066FF] dark:text-[#3D8BFF]" />
                  {feature.title}
                </CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {feature.benefits.map((benefit, idx) => (
                    <li key={idx}>• {benefit}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
