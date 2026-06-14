import { MetadataRoute } from "next";

const BASE_URL = "https://wolbiroyal.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/about",
    "/founder",
    "/contact",
    "/divisions/technologies",
    "/divisions/medical",
    "/divisions/virtual-solutions",
    "/divisions/foundation",
    "/solutions/neomatcare",
    "/solutions/farmasyst",
    "/solutions/maghaz-assist",
    "/industries",
    "/industries/healthcare",
    "/industries/agriculture",
    "/industries/real-estate",
    "/industries/hospitality",
    "/industries/construction",
    "/industries/technology",
    "/projects",
    "/blog",
  ];

  return staticRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/blog" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/solutions") || route.startsWith("/divisions") ? 0.8 : 0.6,
  }));
}
