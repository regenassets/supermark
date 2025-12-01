import MarketingLayout from "@/components/layouts/marketing-layout";
import HomepageFeatures from "@/components/marketing/homepage-features";
import HomepageHero from "@/components/marketing/homepage-hero";
import HomepageInfo from "@/components/marketing/homepage-info";
import HomepageSecurity from "@/components/marketing/homepage-security";

export default function Homepage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        <HomepageHero />
        <HomepageFeatures />
        <HomepageSecurity />
        <HomepageInfo />
      </main>
    </MarketingLayout>
  );
}
