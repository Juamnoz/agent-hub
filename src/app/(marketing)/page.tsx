"use client";

import Link from "next/link";
import {
  Bot,
  MessageSquare,
  Zap,
  Shield,
  ArrowRight,
  Check,
  Globe,
} from "lucide-react";
import { useLocaleStore } from "@/stores/locale-store";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export default function LandingPage() {
  const { t } = useLocaleStore();

  const features = [
    { icon: MessageSquare, ...t.landing.features.whatsapp },
    { icon: Bot, ...t.landing.features.customAgents },
    { icon: Zap, ...t.landing.features.instantResponses },
    { icon: Globe, ...t.landing.features.multilingual },
    { icon: Shield, ...t.landing.features.selfHosted },
    { icon: Check, ...t.landing.features.faqTemplates },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold tracking-tight">Agent Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {t.common.signIn}
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t.common.getStarted}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-32 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground mb-6">
          <Zap className="h-3.5 w-3.5 text-blue-600" />
          {t.landing.badge}
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl max-w-3xl mx-auto">
          {t.landing.heroTitle}{" "}
          <span className="text-blue-600">WhatsApp</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t.landing.heroDescription}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            {t.landing.startTrial}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
          <Link
            href="#features"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-lg border px-6 text-sm font-medium hover:bg-accent transition-colors"
          >
            {t.landing.seeHow}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-[#FAFAFA] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            {t.landing.featuresTitle}
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            {t.landing.featuresDescription}
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border bg-white p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 mb-4">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.landing.pricingTitle}</h2>
          <p className="text-muted-foreground mb-12">
            {t.landing.pricingDescription}
          </p>
          <div className="mx-auto max-w-sm rounded-2xl border-2 border-blue-600 bg-white p-8">
            <h3 className="text-lg font-semibold">{t.landing.proPlan}</h3>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold">$30</span>
              <span className="text-muted-foreground">{t.landing.perMonth}</span>
            </div>
            <ul className="mt-8 space-y-3 text-left">
              {t.landing.planFeatures.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-blue-600 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              {t.landing.startTrial}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-semibold">Agent Hub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.landing.footer}
          </p>
        </div>
      </footer>
    </div>
  );
}
