"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SponsorshipForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    organizationType: "",
    projectDescription: "",
    website: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // For now, just show success and redirect to register
      // In the future, this would call an API endpoint
      toast.success(
        "Thank you for your sponsorship request! We'll review and get back to you soon.",
      );

      // Redirect to register after a brief delay
      setTimeout(() => {
        router.push("/register");
      }, 2000);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex h-screen w-full justify-center">
      <div
        className="absolute inset-x-0 top-10 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
        aria-hidden="true"
      >
        <div
          className="aspect-[1108/632] w-[69.25rem] flex-none bg-gradient-to-r from-[#80caff] to-[#4f46e5] opacity-20"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>
      <div className="z-10 mx-5 mt-[calc(10vh)] h-fit w-full max-w-2xl overflow-hidden rounded-lg border border-border bg-gray-50 dark:bg-gray-900 sm:mx-0 sm:shadow-xl">
        <div className="flex flex-col items-center justify-center space-y-3 px-4 py-6 pt-8 text-center sm:px-16">
          <Link href="/" className="text-2xl font-bold">
            Supermark
          </Link>
          <h3 className="text-2xl font-medium text-foreground">
            Request Sponsorship
          </h3>
          <p className="text-sm text-muted-foreground">
            We support non-profits, charities, and commons builders with
            sponsored access to Supermark hosted infrastructure.
          </p>
        </div>
        <form
          className="flex flex-col gap-4 p-4 pt-8 sm:px-16"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Jane Smith"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="jane@organization.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization Name</Label>
            <Input
              id="organization"
              name="organization"
              placeholder="Example Commons Foundation"
              value={formData.organization}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organizationType">Organization Type</Label>
            <Input
              id="organizationType"
              name="organizationType"
              placeholder="e.g., Non-profit, Charity, Commons project, P2P initiative"
              value={formData.organizationType}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              name="website"
              type="url"
              placeholder="https://example.org"
              value={formData.website}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription">
              Tell us about your project
            </Label>
            <Textarea
              id="projectDescription"
              name="projectDescription"
              placeholder="Share what you're working on, your mission, and how Supermark would help your organization..."
              value={formData.projectDescription}
              onChange={handleChange}
              rows={6}
              required
            />
          </div>

          <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Note on Pricing</p>
            <p className="mt-1">
              Sponsored access is free for qualifying organizations. At a
              certain usage threshold, there may be a small at-cost fee for
              ongoing hosted infrastructure. We&apos;ll work with you to find a
              sustainable arrangement.
            </p>
          </div>

          <Button type="submit" disabled={isSubmitting} className="mt-2">
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
