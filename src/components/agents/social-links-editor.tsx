"use client";

import { useState } from "react";
import {
  Globe,
  Facebook,
  Instagram,
  MapPin,
  Star,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAgentStore } from "@/stores/agent-store";
import { useLocaleStore } from "@/stores/locale-store";
import { sendWebhook } from "@/lib/webhook";
import type { SocialLinks } from "@/lib/mock-data";
import { toast } from "sonner";

interface SocialLinksEditorProps {
  agentId: string;
  initialLinks?: SocialLinks;
}

export function SocialLinksEditor({
  agentId,
  initialLinks,
}: SocialLinksEditorProps) {
  const { updateAgent } = useAgentStore();
  const { t } = useLocaleStore();

  const [website, setWebsite] = useState(initialLinks?.website ?? "");
  const [facebook, setFacebook] = useState(initialLinks?.facebook ?? "");
  const [instagram, setInstagram] = useState(initialLinks?.instagram ?? "");
  const [tiktok, setTiktok] = useState(initialLinks?.tiktok ?? "");
  const [tripadvisor, setTripadvisor] = useState(
    initialLinks?.tripadvisor ?? ""
  );
  const [googleMaps, setGoogleMaps] = useState(initialLinks?.googleMaps ?? "");
  const [isScraping, setIsScraping] = useState(false);

  function handleSave() {
    const links: SocialLinks = {};
    if (website.trim()) links.website = website.trim();
    if (facebook.trim()) links.facebook = facebook.trim();
    if (instagram.trim()) links.instagram = instagram.trim();
    if (tiktok.trim()) links.tiktok = tiktok.trim();
    if (tripadvisor.trim()) links.tripadvisor = tripadvisor.trim();
    if (googleMaps.trim()) links.googleMaps = googleMaps.trim();

    updateAgent(agentId, { socialLinks: links });
    toast.success(t.socialLinks.saved);
  }

  function handleScrape() {
    if (!website.trim()) {
      toast.error(t.socialLinks.noWebsite);
      return;
    }

    setIsScraping(true);

    // Simulate scraping - in production this sends a webhook to n8n
    sendWebhook("settings.updated", {
      agentId,
      action: "scrape",
      urls: {
        website: website.trim(),
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
        tripadvisor: tripadvisor.trim(),
        googleMaps: googleMaps.trim(),
      },
    });

    setTimeout(() => {
      setIsScraping(false);
      toast.success(t.socialLinks.scrapeSuccess);
    }, 3000);
  }

  const fields = [
    {
      id: "website",
      label: t.socialLinks.website,
      placeholder: t.socialLinks.websitePlaceholder,
      icon: Globe,
      value: website,
      onChange: setWebsite,
    },
    {
      id: "facebook",
      label: t.socialLinks.facebook,
      placeholder: t.socialLinks.facebookPlaceholder,
      icon: Facebook,
      value: facebook,
      onChange: setFacebook,
    },
    {
      id: "instagram",
      label: t.socialLinks.instagram,
      placeholder: t.socialLinks.instagramPlaceholder,
      icon: Instagram,
      value: instagram,
      onChange: setInstagram,
    },
    {
      id: "tiktok",
      label: t.socialLinks.tiktok,
      placeholder: t.socialLinks.tiktokPlaceholder,
      icon: Globe,
      value: tiktok,
      onChange: setTiktok,
    },
    {
      id: "tripadvisor",
      label: t.socialLinks.tripadvisor,
      placeholder: t.socialLinks.tripadvisorPlaceholder,
      icon: Star,
      value: tripadvisor,
      onChange: setTripadvisor,
    },
    {
      id: "google-maps",
      label: t.socialLinks.googleMaps,
      placeholder: t.socialLinks.googleMapsPlaceholder,
      icon: MapPin,
      value: googleMaps,
      onChange: setGoogleMaps,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Social Links Form */}
      <Card>
        <CardHeader>
          <CardTitle>{t.socialLinks.title}</CardTitle>
          <CardDescription>{t.socialLinks.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Input
                    id={field.id}
                    type="url"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave}>{t.common.save}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Scraping Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t.socialLinks.scrapingTitle}</CardTitle>
          <CardDescription>
            {t.socialLinks.scrapingDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleScrape}
            disabled={isScraping}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isScraping ? "animate-spin" : ""}`}
            />
            {isScraping ? t.socialLinks.scraping : t.socialLinks.scrapeNow}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
