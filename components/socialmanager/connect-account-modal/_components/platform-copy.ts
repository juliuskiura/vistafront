import type { SocialMediaPlatform, SocialPlatform } from "@/lib/api/types";

export interface PlatformOption {
  id: SocialPlatform;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface PlatformDetails {
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const PLATFORM_DETAILS: Record<string, PlatformDetails> = {
  instagram: {
    description: "Share photos, stories, and reels with the people who follow you.",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
  },
  x: {
    description: "Post short updates, threads, and photos to your X profile.",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  linkedin: {
    description: "Publish updates to your LinkedIn profile or company page.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  facebook: {
    description: "Share posts, photos, and videos with your Facebook audience.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  tiktok: {
    description: "Publish short videos to your TikTok followers.",
    color: "text-slate-900",
    bgColor: "bg-slate-100",
    borderColor: "border-slate-300",
  },
  pinterest: {
    description: "Pin your images and ideas to Pinterest boards.",
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200",
  },
  youtube: {
    description: "Upload videos and Shorts to your YouTube channel.",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  threads: {
    description: "Post short text updates and images on Threads.",
    color: "text-zinc-900",
    bgColor: "bg-zinc-100",
    borderColor: "border-zinc-300",
  },
  bluesky: {
    description: "Post updates and images to your Bluesky profile.",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  mastodon: {
    description: "Share posts with your Mastodon community.",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  google_business: {
    description: "Keep your business profile up to date on Google.",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

const FALLBACK_DETAILS: PlatformDetails = {
  description: "Connect your account in a couple of quick steps.",
  color: "text-slate-600",
  bgColor: "bg-slate-50",
  borderColor: "border-slate-200",
};

export function buildPlatformOptions(platforms: SocialMediaPlatform[]): PlatformOption[] {
  return platforms
    .filter((p) => p.is_active)
    .map((p) => {
      const details =
        PLATFORM_DETAILS[p.slug] ?? { ...FALLBACK_DETAILS, description: `Connect your ${p.name} account.` };
      return {
        id: p.slug as SocialPlatform,
        name: p.name,
        description: details.description,
        color: details.color,
        bgColor: details.bgColor,
        borderColor: details.borderColor,
      };
    });
}