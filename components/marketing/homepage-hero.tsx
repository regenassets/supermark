import Link from "next/link";

import { ArrowRightIcon, GithubIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomepageHero() {
  return (
    <section className="container flex flex-col items-center gap-6 pb-8 pt-6 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl lg:leading-[1.1]">
          Fully Open Source Document Sharing,
          <br className="hidden sm:inline" /> Signing and Tracking
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          Self-host Supermark to share documents securely with custom branding,
          advanced analytics, and full data ownership. AGPL-3.0 licensed.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/register">
          <Button size="lg" className="w-full gap-2 sm:w-auto">
            Get Started Free
            <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Link
          href="https://github.com/regenassets/supermark"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            variant="outline"
            size="lg"
            className="w-full gap-2 sm:w-auto"
          >
            <GithubIcon className="h-4 w-4" />
            View on GitHub
          </Button>
        </Link>
      </div>
    </section>
  );
}
