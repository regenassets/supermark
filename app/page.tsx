import MarketingLayout from "@/components/layouts/marketing-layout";
import HomepageHero from "@/components/marketing/homepage-hero";
import HomepageFeatures from "@/components/marketing/homepage-features";
import HomepageInfo from "@/components/marketing/homepage-info";

export default function Homepage() {
  return (
    <MarketingLayout>
      <main className="flex-1">
        <HomepageHero />
        <HomepageFeatures />
        <HomepageInfo />
      </main>
    </MarketingLayout>
  );
}
