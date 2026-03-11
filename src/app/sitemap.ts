import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

const SITE_URL = "https://book.philosophie.ai";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/thinkers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // Dynamic topic pages
  const topics = await prisma.topic.findMany({
    where: { status: "active" },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const topicPages: MetadataRoute.Sitemap = topics.map((topic) => ({
    url: `${SITE_URL}/topic/${topic.id}`,
    lastModified: topic.createdAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // Dynamic thinker profile pages
  const thinkers = await prisma.thinker.findMany({
    select: { id: true },
  });

  const thinkerPages: MetadataRoute.Sitemap = thinkers.map((thinker) => ({
    url: `${SITE_URL}/thinkers/${thinker.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...topicPages, ...thinkerPages];
}
