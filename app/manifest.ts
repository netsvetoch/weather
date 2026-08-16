import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Погода",
    short_name: "Погода",
    description: "Текущая погода, прогноз и качество воздуха",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#0B1220",
    lang: "ru",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  }
}
