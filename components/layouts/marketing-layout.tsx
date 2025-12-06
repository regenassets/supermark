"use client";

import Link from "next/link";

import { GithubIcon, ChevronDown } from "lucide-react";
import { useState } from "react";

const SUPER_FAMILY_PRODUCTS = [
  {
    name: "Supermark",
    tagline: "Document Sharing with Analytics",
    url: "https://supermark.cc",
    color: "#0066FF",
  },
  {
    name: "Supersign",
    tagline: "E-Signatures Without Per-Envelope Fees",
    url: "https://supersign.cc",
    color: "#10B981",
  },
  {
    name: "Superforms",
    tagline: "AI-Powered Form Builder",
    url: "https://superforms.cc",
    color: "#8B5CF6",
  },
  {
    name: "Supercal",
    tagline: "Calendar Scheduling",
    url: "https://supercal.cc",
    color: "#F59E0B",
  },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold">Supermark</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="hidden md:flex items-center space-x-2">
              {/* Products Dropdown */}
              <div className="relative">
                <button
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setProductsOpen(!productsOpen)}
                  onBlur={() => setTimeout(() => setProductsOpen(false), 200)}
                >
                  Super Family <ChevronDown className="h-3 w-3" />
                </button>

                {productsOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-background/95 backdrop-blur rounded-lg shadow-xl border border-border py-2">
                    {SUPER_FAMILY_PRODUCTS.map((product) => (
                      <a
                        key={product.name}
                        href={product.url}
                        className="block px-4 py-2 hover:bg-accent transition-colors"
                      >
                        <div
                          className="font-semibold text-sm"
                          style={{ color: product.color }}
                        >
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.tagline}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="https://github.com/regenassets/supermark"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <GithubIcon className="mr-2 h-4 w-4" />
                GitHub
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
            </nav>

            {/* Mobile Navigation */}
            <nav className="md:hidden flex items-center space-x-2">
              <Link
                href="/login"
                className="inline-flex h-9 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Footer */}
      <footer className="mt-auto border-t py-12 bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* About Column */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="font-bold text-lg mb-4">Supermark</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Open Source Document Sharing, Signing, and Tracking. Part of
                the Super Family ecosystem.
              </p>
              <p className="text-sm text-muted-foreground">
                Made with ❤️ by{" "}
                <Link
                  href="https://regenerativeassets.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  Regenerative Assets LLC
                </Link>
                . Open source under AGPL-3.0 license.
              </p>
            </div>

            {/* Super Family Column */}
            <div>
              <h4 className="font-semibold mb-4">Super Family</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://super.software"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ecosystem Overview
                  </a>
                </li>
                {SUPER_FAMILY_PRODUCTS.map((product) => (
                  <li key={product.name}>
                    <a
                      href={product.url}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {product.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Column */}
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://github.com/regenassets/supermark"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    GitHub
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://docs.supermark.cc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t pt-8">
            <p className="text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} Supermark. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
