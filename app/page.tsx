import MarketingLayout from "@/components/layouts/marketing-layout";
import HomepageFeatures from "@/components/marketing/homepage-features";
import HomepageHero from "@/components/marketing/homepage-hero";
import HomepageInfo from "@/components/marketing/homepage-info";
import HomepagePricing from "@/components/marketing/homepage-pricing";
import HomepageSecurity from "@/components/marketing/homepage-security";
import HomepageEcosystem from "@/components/marketing/homepage-ecosystem";

export default function Homepage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        <HomepageHero />
        <HomepagePricing />
        <HomepageFeatures />
        <HomepageEcosystem />
        <HomepageSecurity />
        <HomepageInfo />
      </main>
    </MarketingLayout>
  );
}
