import AgplBillingInfo from "@/components/billing/agpl-billing-info";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";

export default function Billing() {
  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div>
          <div className="mb-4 space-y-1 md:mb-8 lg:mb-12">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Billing & Pricing
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn about Supermark&apos;s transparent pricing model
            </p>
          </div>

          <AgplBillingInfo />
        </div>
      </main>
    </AppLayout>
  );
}
