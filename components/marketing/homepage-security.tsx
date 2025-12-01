import {
  CheckCircleIcon,
  EyeIcon,
  LockIcon,
  ServerIcon,
  ShieldCheckIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomepageSecurity() {
  const securityFeatures = [
    {
      icon: ServerIcon,
      title: "Your Infrastructure, Your Rules",
      description:
        "Self-host on your own servers with full control over security policies and data governance.",
    },
    {
      icon: EyeIcon,
      title: "Open Source Transparency",
      description:
        "AGPL-3.0 licensed code that anyone can audit. No hidden backdoors or proprietary black boxes.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Zero Third-Party Access",
      description:
        "Your documents never leave your control. No external servers, no data sharing, ever.",
    },
    {
      icon: LockIcon,
      title: "Industry-Standard Encryption",
      description:
        "AES-256 encryption at rest and in transit. The same standard used by governments and enterprises.",
    },
    {
      icon: CheckCircleIcon,
      title: "Compliance-Ready Architecture",
      description:
        "Built to meet GDPR, HIPAA, and SOC 2 requirements when you host it yourself.",
    },
  ];

  return (
    <section className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-[64rem]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Security Through Ownership
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Self-host for complete control, or choose Supermark Hosted and we
            handle security for you.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="bg-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <feature.icon className="h-5 w-5" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
