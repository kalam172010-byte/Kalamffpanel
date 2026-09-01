import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currencySymbol: string = "₹"): string {
  return `${currencySymbol}${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // Regex supporting:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://www.youtube.com/v/VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : null;
}

export function getYouTubeEmbedUrl(url?: string, autoplay: boolean = true): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&enablejsapi=1`;
}

export function getYouTubeThumbnailUrl(url?: string, quality: 'maxres' | 'hq' | 'mq' = 'hq'): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  const qualityFile = quality === 'maxres' ? 'maxresdefault.jpg' : quality === 'mq' ? 'mqdefault.jpg' : 'hqdefault.jpg';
  return `https://img.youtube.com/vi/${videoId}/${qualityFile}`;
}

export function isYouTubeUrl(url?: string): boolean {
  return Boolean(getYouTubeVideoId(url));
}
