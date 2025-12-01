import { CheckIcon, HeartIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AgplBillingInfo() {
  const features = [
    "Unlimited team members",
    "Unlimited documents",
    "Unlimited data rooms",
    "Custom branding (logo, colors, welcome message)",
    "Custom domains",
    "Advanced link controls (expiration, passwords, emails)",
    "NDA agreements",
    "Document analytics and visitor tracking",
    "Webhooks and integrations (Mattermost, incoming webhooks)",
    "Custom fields and tags",
    "Link presets",
    "API access with tokens",
    "Self-hosted deployment",
    "Full data ownership",
    "No vendor lock-in (AGPL-3.0 licensed)",
  ];

  return (
    <div className="space-y-6">
      {/* Business Model Card */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-red-500" />
            Supermark Business Model
          </CardTitle>
          <CardDescription>
            Open source, self-hosted document sharing platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 font-semibold">Flat Fee Pricing</h3>
            <p className="text-sm text-muted-foreground">
              We charge a <strong>one-time flat fee</strong> for unlimited team
              members and usage, with the following limits:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                • Storage limits apply based on your hosting infrastructure
              </li>
              <li>• No per-user or per-document charges</li>
              <li>• Lifetime access to all features</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-muted/50 p-4">
            <h3 className="mb-2 font-semibold">Value-Based Contributions</h3>
            <p className="text-sm text-muted-foreground">
              If Supermark helps your business succeed, we ask you to{" "}
              <strong>contribute what you think it was worth</strong>. This
              keeps the project sustainable and helps us continue improving the
              platform for everyone.
            </p>
          </div>

          <div className="rounded-lg border bg-blue-50 p-4 dark:bg-blue-950/30">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Open Source:</strong> Supermark is licensed under
              AGPL-3.0. You own your data, control your deployment, and can
              modify the code to fit your needs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>All Features Included</CardTitle>
          <CardDescription>
            Every feature available for your flat fee
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
        </CardContent>
      </Card>

      {/* Support Card */}
      <Card className="bg-transparent">
        <CardHeader>
          <CardTitle>Support & Contact</CardTitle>
          <CardDescription>
            Questions about billing or contributions?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Reach out to discuss pricing, contribute back to the project, or ask
            questions about deployment:
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <a
              href="https://github.com/regenassets/supermark"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              GitHub Repository →
            </a>
            <a
              href="https://github.com/regenassets/supermark/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              Community Discussions →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
