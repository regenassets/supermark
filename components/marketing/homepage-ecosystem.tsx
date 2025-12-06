import Link from "next/link";

const SUPER_FAMILY_PRODUCTS = [
  {
    name: "Supersign",
    tagline: "E-Signatures Without Per-Envelope Fees",
    description: "PKI-compliant digital signatures with cryptographic proof. No $0.50-$2.00 per signature.",
    color: "#10B981",
    url: "https://supersign.cc",
    integration: "Sign documents shared via Supermark with full audit trails",
  },
  {
    name: "Superforms",
    tagline: "AI-Powered Form Builder",
    description: "Claude AI builds forms with validation. No per-submission pricing.",
    color: "#8B5CF6",
    url: "https://superforms.cc",
    integration: "Collect information before sharing proposals or contracts",
  },
  {
    name: "Supercal",
    tagline: "Calendar Scheduling",
    description: "Privacy-first Calendly alternative with flat pricing. No $16-$20 per user/month.",
    color: "#F59E0B",
    url: "https://supercal.cc",
    integration: "Schedule follow-up meetings after document reviews",
  },
];

export default function HomepageEcosystem() {
  return (
    <section className="container py-12 md:py-24">
      <div className="mx-auto max-w-[980px]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Better Together
          </h2>
          <p className="text-lg text-muted-foreground">
            Supermark integrates seamlessly with the entire Super Family ecosystem. 
            Connect your document workflows with signatures, forms, and scheduling.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SUPER_FAMILY_PRODUCTS.map((product) => (
            <Link
              key={product.name}
              href={product.url}
              className="group rounded-lg border border-border bg-card p-6 hover:border-muted-foreground/50 transition-all hover:shadow-md"
            >
              <div className="mb-3">
                <h3 
                  className="text-lg font-semibold mb-1"
                  style={{ color: product.color }}
                >
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {product.tagline}
                </p>
              </div>
              <p className="text-sm mb-3">
                {product.description}
              </p>
              <div className="pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground italic">
                  {product.integration}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="https://super.software"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            Explore the complete Super Family ecosystem →
          </Link>
        </div>
      </div>
    </section>
  );
}
