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
      title: "Transparent Pricing Model",
      description: "One-time fee per company, for the lifetime of your company",
      benefits: [
        "Unlimited users and documents",
        "Space restrictions apply for hosted version",
        "Value-based contributions",
      ],
    },
  ];

  return (
    <section className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index} className="bg-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <feature.icon className="h-5 w-5" />
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
    </section>
  );
}
